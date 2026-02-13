import { useState, useCallback } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { useMetaStore } from '../../../store/metaStore';
import { usePostWebStore } from '../../../store/postWebStore';
import EmployeesTab from './Settings/EmployeesTab/EmployeesTab';
import StatusesTab from './Settings/StatusesTab/StatusesTab';
import DepartmentTab from './Settings/DepartmentTab/DepartmentTab';

/**
 * DepartmentSettingsModal — модальное окно настроек отдела
 * Держит черновик всех данных. Сохранение — только по кнопке "Сохранить".
 */
export default function DepartmentSettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('employees');

  // Снимки из stores (инициализируются при mount = при открытии модалки)
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);
  const storeEmployeeById = useAdminStore(s => s.employeeById);
  const storeEmployeeIds = useAdminStore(s => s.employeeIds);
  const currentConfig = useMetaStore(s => s.currentDepartmentConfig);
  const departmentsList = useMetaStore(s => s.departmentsList);

  // Draft state
  const [draftEmployeeById, setDraftEmployeeById] = useState({});
  const [draftEmployeeIds, setDraftEmployeeIds] = useState([]);
  const [draftStatuses, setDraftStatuses] = useState([]);
  const [draftName, setDraftName] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Инициализация при открытии (isOpen переключился на true)
  if (isOpen && !initialized) {
    setDraftEmployeeById({ ...storeEmployeeById });
    setDraftEmployeeIds([...storeEmployeeIds]);
    setDraftStatuses(currentConfig?.statusConfig ? currentConfig.statusConfig.map(s => ({ ...s })) : []);
    const dept = departmentsList.find(d => d.id === editingDepartmentId);
    setDraftName(dept?.name || '');
    setInitialized(true);
  }
  if (!isOpen && initialized) {
    setInitialized(false);
  }

  // === Employees draft callbacks ===
  const updateEmployee = useCallback((empId, editForm) => {
    setDraftEmployeeById(prev => ({
      ...prev,
      [empId]: { ...prev[empId], name: editForm.name, fullName: editForm.fullName, position: editForm.position }
    }));
  }, []);

  const addEmployee = useCallback((form) => {
    if (!form.id || !form.fullName) return;
    if (draftEmployeeById[form.id]) {
      alert('Сотрудник с таким ID уже существует');
      return;
    }
    setDraftEmployeeById(prev => ({
      ...prev,
      [form.id]: { id: form.id, name: form.name || form.fullName, fullName: form.fullName, position: form.position }
    }));
    setDraftEmployeeIds(prev => [...prev, form.id]);
  }, [draftEmployeeById]);

  const deleteEmployee = useCallback((empId) => {
    setDraftEmployeeById(prev => {
      const next = { ...prev };
      delete next[empId];
      return next;
    });
    setDraftEmployeeIds(prev => prev.filter(id => id !== empId));
  }, []);

  // === Сохранить всё ===
  const handleSave = useCallback(() => {
    if (!editingDepartmentId) return;

    // 1. Сотрудники → store + localStorage
    useAdminStore.setState({
      employeeById: draftEmployeeById,
      employeeIds: draftEmployeeIds
    });
    usePostWebStore.getState().updateEmployees(editingDepartmentId, {
      employeeById: draftEmployeeById,
      employeeIds: draftEmployeeIds
    });

    // 2. Обозначения → metaStore + localStorage
    const newConfig = {
      ...currentConfig,
      statusConfig: draftStatuses,
      name: draftName.trim()
    };
    const colorMap = useMetaStore.getState().buildColorMap(newConfig);
    useMetaStore.setState({ currentDepartmentConfig: newConfig, statusColorMap: colorMap });
    usePostWebStore.getState().saveDepartmentConfig(editingDepartmentId, newConfig);

    // 3. Имя отдела → departmentsList + localStorage
    const updatedList = departmentsList.map(d =>
      d.id === editingDepartmentId ? { ...d, name: draftName.trim() } : d
    );
    useMetaStore.setState({ departmentsList: updatedList });
    usePostWebStore.getState().updateDepartmentName(editingDepartmentId, draftName.trim());

    onClose();
  }, [editingDepartmentId, draftEmployeeById, draftEmployeeIds, draftStatuses, draftName, currentConfig, departmentsList, onClose]);

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
          {activeTab === 'employees' && (
            <EmployeesTab
              employeeById={draftEmployeeById}
              employeeIds={draftEmployeeIds}
              onSave={updateEmployee}
              onAdd={addEmployee}
              onDelete={deleteEmployee}
            />
          )}
          {activeTab === 'statuses' && (
            <StatusesTab
              statuses={draftStatuses}
              onChange={setDraftStatuses}
            />
          )}
          {activeTab === 'department' && (
            <DepartmentTab
              name={draftName}
              onNameChange={setDraftName}
            />
          )}
        </div>

        <div style={footerStyle}>
          <button onClick={handleSave} style={saveBtnStyle}>Сохранить</button>
          <button onClick={onClose} style={cancelBtnStyle}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

// Стили

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

const footerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid #e0e0e0'
};

const saveBtnStyle = {
  padding: '8px 24px',
  fontSize: '14px',
  fontWeight: 500,
  border: 'none',
  backgroundColor: '#1976d2',
  color: 'white',
  borderRadius: '4px',
  cursor: 'pointer'
};

const cancelBtnStyle = {
  padding: '8px 24px',
  fontSize: '14px',
  border: '1px solid #ccc',
  backgroundColor: 'white',
  color: '#333',
  borderRadius: '4px',
  cursor: 'pointer'
};
