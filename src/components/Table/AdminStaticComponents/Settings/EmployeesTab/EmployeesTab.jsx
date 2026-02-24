import { useState } from 'react';
import s from '../Settings.module.css';
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
      <div className={s.scrollContainer}>
        <table className={s.table}>
          <thead>
            <tr>
              <th className={s.th}>ID</th>
              <th className={s.th}>Краткое имя</th>
              <th className={s.th}>Полное имя</th>
              <th className={s.th}>Должность</th>
              <th className={s.th}>Действия</th>
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
          className={s.addButton}
        >
          + Добавить сотрудника
        </button>
      )}
    </div>
  );
}
