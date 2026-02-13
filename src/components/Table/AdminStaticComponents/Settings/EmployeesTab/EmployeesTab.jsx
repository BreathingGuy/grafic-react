import { useState } from 'react';
import { tableStyle, thStyle, smallBtnStyle } from '../settingsStyles';
import EmployeeRow from './EmployeeRow';
import AddEmployeeForm from './AddEmployeeForm';

/**
 * EmployeesTab — вкладка управления сотрудниками (controlled)
 * Props: employeeById, employeeIds, onSave, onAdd, onDelete
 */
export default function EmployeesTab({ employeeById, employeeIds, onSave, onAdd, onDelete }) {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = (form) => {
    onAdd(form);
    setShowAddForm(false);
  };

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
                  onSave={onSave}
                  onDelete={onDelete}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddForm ? (
        <AddEmployeeForm
          onAdd={handleAdd}
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
