import { useState } from 'react';
import styles from './EmployeeEditor.module.css';

/**
 * EmployeeEditor - Редактор списка сотрудников
 *
 * Позволяет:
 * - Добавлять новых сотрудников
 * - Редактировать ФИО и должность
 * - Удалять сотрудников
 */
export default function EmployeeEditor({ employees, onChange }) {
  const handleAdd = () => {
    const newId = employees.length > 0
      ? Math.max(...employees.map(e => e.id)) + 1
      : 1000;

    onChange([
      ...employees,
      { id: newId, family: '', name1: '', name2: '', position: '' }
    ]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...employees];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleRemove = (index) => {
    if (employees.length === 1) {
      alert('Должен остаться хотя бы один сотрудник');
      return;
    }
    onChange(employees.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Список сотрудников</h3>
        <button className={styles.addButton} onClick={handleAdd}>
          + Добавить сотрудника
        </button>
      </div>

      <div className={styles.list}>
        {employees.map((employee, index) => (
          <div key={employee.id} className={styles.employeeCard}>
            <div className={styles.cardHeader}>
              <span className={styles.employeeNumber}>#{index + 1}</span>
              <span className={styles.employeeId}>ID: {employee.id}</span>
              {employees.length > 1 && (
                <button
                  className={styles.removeButton}
                  onClick={() => handleRemove(index)}
                  title="Удалить сотрудника"
                >
                  ×
                </button>
              )}
            </div>

            <div className={styles.fields}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Фамилия *</label>
                  <input
                    type="text"
                    value={employee.family}
                    onChange={(e) => handleChange(index, 'family', e.target.value)}
                    placeholder="Иванов"
                  />
                </div>

                <div className={styles.field}>
                  <label>Имя *</label>
                  <input
                    type="text"
                    value={employee.name1}
                    onChange={(e) => handleChange(index, 'name1', e.target.value)}
                    placeholder="Иван"
                  />
                </div>

                <div className={styles.field}>
                  <label>Отчество *</label>
                  <input
                    type="text"
                    value={employee.name2}
                    onChange={(e) => handleChange(index, 'name2', e.target.value)}
                    placeholder="Иванович"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>Должность</label>
                <input
                  type="text"
                  value={employee.position}
                  onChange={(e) => handleChange(index, 'position', e.target.value)}
                  placeholder="Специалист"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {employees.length === 0 && (
        <div className={styles.emptyState}>
          <p>Нет сотрудников. Добавьте хотя бы одного.</p>
        </div>
      )}
    </div>
  );
}
