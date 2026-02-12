import { useState, useCallback } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { useMetaStore } from '../../../store/metaStore';
import { usePostWebStore } from '../../../store/postWebStore';

/**
 * DepartmentSettingsModal — модальное окно настроек отдела
 * Три раздела: Сотрудники, Обозначения (statusConfig), Название отдела
 */
export default function DepartmentSettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('employees');

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0 }}>Настройки отдела</h3>
          <button onClick={onClose} style={closeButtonStyle}>&times;</button>
        </div>

        <div style={tabsStyle}>
          <button
            style={activeTab === 'employees' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('employees')}
          >
            Сотрудники
          </button>
          <button
            style={activeTab === 'statuses' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('statuses')}
          >
            Обозначения
          </button>
          <button
            style={activeTab === 'department' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('department')}
          >
            Отдел
          </button>
        </div>

        <div style={contentStyle}>
          {activeTab === 'employees' && <EmployeesTab />}
          {activeTab === 'statuses' && <StatusesTab />}
          {activeTab === 'department' && <DepartmentTab />}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EmployeesTab — управление сотрудниками
// ============================================================

function EmployeesTab() {
  const employeeIds = useAdminStore(s => s.employeeIds);
  const employeeById = useAdminStore(s => s.employeeById);
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', fullName: '', position: '' });
  const [addForm, setAddForm] = useState({ id: '', name: '', fullName: '', position: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const startEdit = (empId) => {
    const emp = employeeById[empId];
    setEditForm({ name: emp.name, fullName: emp.fullName, position: emp.position || '' });
    setEditingId(empId);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = useCallback(() => {
    if (!editingId || !editingDepartmentId) return;

    const newEmployeeById = {
      ...employeeById,
      [editingId]: {
        ...employeeById[editingId],
        name: editForm.name,
        fullName: editForm.fullName,
        position: editForm.position
      }
    };

    // Обновляем adminStore
    useAdminStore.setState({ employeeById: newEmployeeById });

    // Сохраняем в localStorage
    usePostWebStore.getState().updateEmployees(editingDepartmentId, {
      employeeById: newEmployeeById,
      employeeIds
    });

    setEditingId(null);
  }, [editingId, editingDepartmentId, employeeById, employeeIds, editForm]);

  const addEmployee = useCallback(() => {
    if (!addForm.id || !addForm.fullName || !editingDepartmentId) return;

    // Проверяем уникальность ID
    if (employeeById[addForm.id]) {
      alert('Сотрудник с таким ID уже существует');
      return;
    }

    const newEmployeeById = {
      ...employeeById,
      [addForm.id]: {
        id: addForm.id,
        name: addForm.name || addForm.fullName,
        fullName: addForm.fullName,
        position: addForm.position
      }
    };
    const newEmployeeIds = [...employeeIds, addForm.id];

    // Обновляем adminStore
    useAdminStore.setState({
      employeeById: newEmployeeById,
      employeeIds: newEmployeeIds
    });

    // Сохраняем в localStorage
    usePostWebStore.getState().updateEmployees(editingDepartmentId, {
      employeeById: newEmployeeById,
      employeeIds: newEmployeeIds
    });

    setAddForm({ id: '', name: '', fullName: '', position: '' });
    setShowAddForm(false);
  }, [addForm, editingDepartmentId, employeeById, employeeIds]);

  const deleteEmployee = useCallback((empId) => {
    if (!editingDepartmentId) return;
    if (!window.confirm(`Удалить сотрудника ${employeeById[empId]?.fullName}?`)) return;

    const newEmployeeById = { ...employeeById };
    delete newEmployeeById[empId];
    const newEmployeeIds = employeeIds.filter(id => id !== empId);

    useAdminStore.setState({
      employeeById: newEmployeeById,
      employeeIds: newEmployeeIds
    });

    usePostWebStore.getState().updateEmployees(editingDepartmentId, {
      employeeById: newEmployeeById,
      employeeIds: newEmployeeIds
    });
  }, [editingDepartmentId, employeeById, employeeIds]);

  return (
    <div>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Краткое имя</th>
              <th style={thStyle}>Полное имя</th>
              <th style={thStyle}>Должность</th>
              <th style={thStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {employeeIds.map(empId => {
              const emp = employeeById[empId];
              if (!emp) return null;

              if (editingId === empId) {
                return (
                  <tr key={empId}>
                    <td style={tdStyle}>{empId}</td>
                    <td style={tdStyle}>
                      <input
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        style={inputStyle}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        value={editForm.fullName}
                        onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                        style={inputStyle}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        value={editForm.position}
                        onChange={e => setEditForm(f => ({ ...f, position: e.target.value }))}
                        style={inputStyle}
                      />
                    </td>
                    <td style={tdStyle}>
                      <button onClick={saveEdit} style={smallBtnStyle}>Сохр.</button>
                      <button onClick={cancelEdit} style={smallBtnGrayStyle}>Отм.</button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={empId}>
                  <td style={tdStyle}>{empId}</td>
                  <td style={tdStyle}>{emp.name}</td>
                  <td style={tdStyle}>{emp.fullName}</td>
                  <td style={tdStyle}>{emp.position}</td>
                  <td style={tdStyle}>
                    <button onClick={() => startEdit(empId)} style={smallBtnStyle}>Ред.</button>
                    <button onClick={() => deleteEmployee(empId)} style={smallBtnRedStyle}>Уд.</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddForm ? (
        <div style={addFormStyle}>
          <h4 style={{ margin: '0 0 8px 0' }}>Новый сотрудник</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              placeholder="ID"
              value={addForm.id}
              onChange={e => setAddForm(f => ({ ...f, id: e.target.value }))}
              style={{ ...inputStyle, width: '80px' }}
            />
            <input
              placeholder="Краткое имя"
              value={addForm.name}
              onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="Полное имя"
              value={addForm.fullName}
              onChange={e => setAddForm(f => ({ ...f, fullName: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="Должность"
              value={addForm.position}
              onChange={e => setAddForm(f => ({ ...f, position: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div style={{ marginTop: '8px' }}>
            <button onClick={addEmployee} style={smallBtnStyle}>Добавить</button>
            <button onClick={() => setShowAddForm(false)} style={smallBtnGrayStyle}>Отмена</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          style={{ ...smallBtnStyle, marginTop: '12px' }}
        >
          + Добавить сотрудника
        </button>
      )}
    </div>
  );
}

// ============================================================
// StatusesTab — управление обозначениями (statusConfig)
// ============================================================

function StatusesTab() {
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);
  const currentConfig = useMetaStore(s => s.currentDepartmentConfig);

  const statuses = currentConfig?.statusConfig || [];
  const [editingIdx, setEditingIdx] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    code: '', codeWork: '', codeList: '', label: '',
    colorText: '#000000', colorBack: '#ffffff', descriptin: ''
  });

  const saveConfig = useCallback((newStatuses) => {
    if (!editingDepartmentId || !currentConfig) return;

    const newConfig = {
      ...currentConfig,
      statusConfig: newStatuses
    };

    // Обновляем metaStore
    useMetaStore.setState({ currentDepartmentConfig: newConfig });

    // Сохраняем в localStorage
    usePostWebStore.getState().saveDepartmentConfig(editingDepartmentId, newConfig);
  }, [editingDepartmentId, currentConfig]);

  const startEdit = (idx) => {
    setEditForm({ ...statuses[idx] });
    setEditingIdx(idx);
  };

  const cancelEdit = () => {
    setEditingIdx(null);
  };

  const saveEdit = () => {
    const newStatuses = [...statuses];
    newStatuses[editingIdx] = { ...editForm };
    saveConfig(newStatuses);
    setEditingIdx(null);
  };

  const addStatus = () => {
    if (!addForm.code) return;
    const newStatuses = [...statuses, { ...addForm }];
    saveConfig(newStatuses);
    setAddForm({
      code: '', codeWork: '', codeList: '', label: '',
      colorText: '#000000', colorBack: '#ffffff', descriptin: ''
    });
    setShowAddForm(false);
  };

  const deleteStatus = (idx) => {
    if (!window.confirm(`Удалить обозначение "${statuses[idx].code}"?`)) return;
    const newStatuses = statuses.filter((_, i) => i !== idx);
    saveConfig(newStatuses);
  };

  return (
    <div>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Код</th>
              <th style={thStyle}>Отобр.</th>
              <th style={thStyle}>Список</th>
              <th style={thStyle}>Название</th>
              <th style={thStyle}>Цвет текста</th>
              <th style={thStyle}>Цвет фона</th>
              <th style={thStyle}>Описание</th>
              <th style={thStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((status, idx) => {
              if (editingIdx === idx) {
                return (
                  <tr key={idx}>
                    <td style={tdStyle}>
                      <input
                        value={editForm.code}
                        onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))}
                        style={{ ...inputStyle, width: '40px' }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        value={editForm.codeWork || ''}
                        onChange={e => setEditForm(f => ({ ...f, codeWork: e.target.value }))}
                        style={{ ...inputStyle, width: '40px' }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        value={editForm.codeList || ''}
                        onChange={e => setEditForm(f => ({ ...f, codeList: e.target.value }))}
                        style={{ ...inputStyle, width: '40px' }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        value={editForm.label}
                        onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                        style={inputStyle}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="color"
                        value={editForm.colorText || '#000000'}
                        onChange={e => setEditForm(f => ({ ...f, colorText: e.target.value }))}
                        style={colorInputStyle}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="color"
                        value={editForm.colorBack || '#ffffff'}
                        onChange={e => setEditForm(f => ({ ...f, colorBack: e.target.value }))}
                        style={colorInputStyle}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        value={editForm.descriptin || ''}
                        onChange={e => setEditForm(f => ({ ...f, descriptin: e.target.value }))}
                        style={inputStyle}
                      />
                    </td>
                    <td style={tdStyle}>
                      <button onClick={saveEdit} style={smallBtnStyle}>Сохр.</button>
                      <button onClick={cancelEdit} style={smallBtnGrayStyle}>Отм.</button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={idx}>
                  <td style={tdStyle}><strong>{status.code}</strong></td>
                  <td style={tdStyle}>{status.codeWork}</td>
                  <td style={tdStyle}>{status.codeList}</td>
                  <td style={tdStyle}>{status.label}</td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block', width: '20px', height: '20px',
                      backgroundColor: status.colorText || '#000', border: '1px solid #ccc',
                      verticalAlign: 'middle'
                    }} />
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block', width: '20px', height: '20px',
                      backgroundColor: status.colorBack || '#fff', border: '1px solid #ccc',
                      verticalAlign: 'middle'
                    }} />
                  </td>
                  <td style={tdStyle}>{status.descriptin}</td>
                  <td style={tdStyle}>
                    <button onClick={() => startEdit(idx)} style={smallBtnStyle}>Ред.</button>
                    <button onClick={() => deleteStatus(idx)} style={smallBtnRedStyle}>Уд.</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddForm ? (
        <div style={addFormStyle}>
          <h4 style={{ margin: '0 0 8px 0' }}>Новое обозначение</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Код"
              value={addForm.code}
              onChange={e => setAddForm(f => ({ ...f, code: e.target.value }))}
              style={{ ...inputStyle, width: '50px' }}
            />
            <input
              placeholder="Отобр."
              value={addForm.codeWork}
              onChange={e => setAddForm(f => ({ ...f, codeWork: e.target.value }))}
              style={{ ...inputStyle, width: '50px' }}
            />
            <input
              placeholder="Список"
              value={addForm.codeList}
              onChange={e => setAddForm(f => ({ ...f, codeList: e.target.value }))}
              style={{ ...inputStyle, width: '50px' }}
            />
            <input
              placeholder="Название"
              value={addForm.label}
              onChange={e => setAddForm(f => ({ ...f, label: e.target.value }))}
              style={inputStyle}
            />
            <label style={{ fontSize: '12px' }}>
              Текст: <input
                type="color"
                value={addForm.colorText}
                onChange={e => setAddForm(f => ({ ...f, colorText: e.target.value }))}
                style={colorInputStyle}
              />
            </label>
            <label style={{ fontSize: '12px' }}>
              Фон: <input
                type="color"
                value={addForm.colorBack}
                onChange={e => setAddForm(f => ({ ...f, colorBack: e.target.value }))}
                style={colorInputStyle}
              />
            </label>
            <input
              placeholder="Описание"
              value={addForm.descriptin}
              onChange={e => setAddForm(f => ({ ...f, descriptin: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div style={{ marginTop: '8px' }}>
            <button onClick={addStatus} style={smallBtnStyle}>Добавить</button>
            <button onClick={() => setShowAddForm(false)} style={smallBtnGrayStyle}>Отмена</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          style={{ ...smallBtnStyle, marginTop: '12px' }}
        >
          + Добавить обозначение
        </button>
      )}
    </div>
  );
}

// ============================================================
// DepartmentTab — редактирование имени отдела
// ============================================================

function DepartmentTab() {
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);
  const departmentsList = useMetaStore(s => s.departmentsList);
  const currentConfig = useMetaStore(s => s.currentDepartmentConfig);

  const currentDept = departmentsList.find(d => d.id === editingDepartmentId);
  const [name, setName] = useState(currentDept?.name || '');

  const saveName = async () => {
    if (!name.trim() || !editingDepartmentId) return;

    // Обновляем в localStorage через postWebStore
    await usePostWebStore.getState().updateDepartmentName(editingDepartmentId, name.trim());

    // Обновляем metaStore
    const updatedList = departmentsList.map(d =>
      d.id === editingDepartmentId ? { ...d, name: name.trim() } : d
    );
    useMetaStore.setState({ departmentsList: updatedList });

    // Обновляем конфиг (если он содержит имя)
    if (currentConfig) {
      const updatedConfig = { ...currentConfig, name: name.trim() };
      useMetaStore.setState({ currentDepartmentConfig: updatedConfig });
      await usePostWebStore.getState().saveDepartmentConfig(editingDepartmentId, updatedConfig);
    }

    alert('Имя отдела сохранено');
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: 500, marginBottom: '4px' }}>
          ID отдела
        </label>
        <input value={editingDepartmentId || ''} disabled style={{ ...inputStyle, backgroundColor: '#f5f5f5' }} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: 500, marginBottom: '4px' }}>
          Название отдела
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ ...inputStyle, width: '300px' }}
        />
      </div>
      <button onClick={saveName} style={smallBtnStyle}>
        Сохранить
      </button>
    </div>
  );
}

// ============================================================
// Стили
// ============================================================

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalStyle = {
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '24px',
  minWidth: '700px',
  maxWidth: '90vw',
  maxHeight: '85vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  padding: '4px 8px',
  color: '#666'
};

const tabsStyle = {
  display: 'flex',
  gap: '4px',
  marginBottom: '16px',
  borderBottom: '2px solid #e0e0e0',
  paddingBottom: '0'
};

const tabStyle = {
  padding: '8px 16px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  color: '#666',
  borderBottom: '2px solid transparent',
  marginBottom: '-2px'
};

const activeTabStyle = {
  ...tabStyle,
  color: '#1976d2',
  fontWeight: 500,
  borderBottom: '2px solid #1976d2'
};

const contentStyle = {
  flex: 1,
  overflow: 'auto'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px'
};

const thStyle = {
  padding: '8px',
  borderBottom: '2px solid #e0e0e0',
  textAlign: 'left',
  fontWeight: 500,
  whiteSpace: 'nowrap'
};

const tdStyle = {
  padding: '6px 8px',
  borderBottom: '1px solid #f0f0f0',
  verticalAlign: 'middle'
};

const inputStyle = {
  padding: '4px 8px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '13px'
};

const colorInputStyle = {
  width: '32px',
  height: '24px',
  padding: '0',
  border: '1px solid #ccc',
  borderRadius: '4px',
  cursor: 'pointer'
};

const smallBtnStyle = {
  padding: '4px 10px',
  fontSize: '12px',
  border: '1px solid #1976d2',
  backgroundColor: '#1976d2',
  color: 'white',
  borderRadius: '4px',
  cursor: 'pointer',
  marginRight: '4px'
};

const smallBtnGrayStyle = {
  ...smallBtnStyle,
  backgroundColor: '#999',
  borderColor: '#999'
};

const smallBtnRedStyle = {
  ...smallBtnStyle,
  backgroundColor: '#d32f2f',
  borderColor: '#d32f2f'
};

const addFormStyle = {
  marginTop: '12px',
  padding: '12px',
  backgroundColor: '#f9f9f9',
  borderRadius: '6px',
  border: '1px solid #e0e0e0'
};
