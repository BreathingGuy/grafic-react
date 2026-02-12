import { useState, useCallback } from 'react';
import { useAdminStore } from '../../../../store/adminStore';
import { usePostWebStore } from '../../../../store/postWebStore';
import {
  tableStyle, thStyle, tdStyle, inputStyle,
  smallBtnStyle, smallBtnGrayStyle, smallBtnRedStyle, addFormStyle
} from './settingsStyles';

export default function EmployeesTab() {
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

    useAdminStore.setState({ employeeById: newEmployeeById });

    usePostWebStore.getState().updateEmployees(editingDepartmentId, {
      employeeById: newEmployeeById,
      employeeIds
    });

    setEditingId(null);
  }, [editingId, editingDepartmentId, employeeById, employeeIds, editForm]);

  const addEmployee = useCallback(() => {
    if (!addForm.id || !addForm.fullName || !editingDepartmentId) return;

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

    useAdminStore.setState({
      employeeById: newEmployeeById,
      employeeIds: newEmployeeIds
    });

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
