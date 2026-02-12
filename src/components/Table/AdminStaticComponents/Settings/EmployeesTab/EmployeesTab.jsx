import { useState, useCallback } from 'react';
import { useAdminStore } from '../../../../../store/adminStore';
import { usePostWebStore } from '../../../../../store/postWebStore';
import { tableStyle, thStyle, smallBtnStyle } from '../settingsStyles';
import EmployeeRow from './EmployeeRow';
import AddEmployeeForm from './AddEmployeeForm';

/**
 * EmployeesTab — вкладка управления сотрудниками
 * Композиция: таблица EmployeeRow + AddEmployeeForm
 */
export default function EmployeesTab() {
  const employeeIds = useAdminStore(s => s.employeeIds);
  const employeeById = useAdminStore(s => s.employeeById);
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);

  const [showAddForm, setShowAddForm] = useState(false);

  const saveEmployee = useCallback((empId, editForm) => {
    if (!editingDepartmentId) return;

    const newEmployeeById = {
      ...employeeById,
      [empId]: {
        ...employeeById[empId],
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
  }, [editingDepartmentId, employeeById, employeeIds]);

  const addEmployee = useCallback((form) => {
    if (!form.id || !form.fullName || !editingDepartmentId) return;

    if (employeeById[form.id]) {
      alert('Сотрудник с таким ID уже существует');
      return;
    }

    const newEmployeeById = {
      ...employeeById,
      [form.id]: {
        id: form.id,
        name: form.name || form.fullName,
        fullName: form.fullName,
        position: form.position
      }
    };
    const newEmployeeIds = [...employeeIds, form.id];

    useAdminStore.setState({
      employeeById: newEmployeeById,
      employeeIds: newEmployeeIds
    });

    usePostWebStore.getState().updateEmployees(editingDepartmentId, {
      employeeById: newEmployeeById,
      employeeIds: newEmployeeIds
    });

    setShowAddForm(false);
  }, [editingDepartmentId, employeeById, employeeIds]);

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
              return (
                <EmployeeRow
                  key={empId}
                  empId={empId}
                  employee={emp}
                  onSave={saveEmployee}
                  onDelete={deleteEmployee}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddForm ? (
        <AddEmployeeForm
          onAdd={addEmployee}
          onCancel={() => setShowAddForm(false)}
        />
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
