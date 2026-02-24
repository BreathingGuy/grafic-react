import { useState } from 'react';
import s from '../Settings.module.css';

/**
 * EmployeeRow — строка сотрудника (просмотр / редактирование)
 * Самодостаточный компонент — сам управляет режимом редактирования
 */
export default function EmployeeRow({ empId, employee, onSave, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', fullName: '', position: '' });

  const startEdit = () => {
    setEditForm({
      name: employee.name,
      fullName: employee.fullName,
      position: employee.position || ''
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    onSave(empId, editForm);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr>
        <td className={s.td}>{empId}</td>
        <td className={s.td}>
          <input
            value={editForm.name}
            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
            className={s.input}
          />
        </td>
        <td className={s.td}>
          <input
            value={editForm.fullName}
            onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
            className={s.input}
          />
        </td>
        <td className={s.td}>
          <input
            value={editForm.position}
            onChange={e => setEditForm(f => ({ ...f, position: e.target.value }))}
            className={s.input}
          />
        </td>
        <td className={s.td}>
          <button onClick={saveEdit} className={s.smallBtn}>Сохр.</button>
          <button onClick={cancelEdit} className={s.smallBtnGray}>Отм.</button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className={s.td}>{empId}</td>
      <td className={s.td}>{employee.name}</td>
      <td className={s.td}>{employee.fullName}</td>
      <td className={s.td}>{employee.position}</td>
      <td className={s.td}>
        <button onClick={startEdit} className={s.smallBtn}>Ред.</button>
        <button onClick={() => onDelete(empId)} className={s.smallBtnRed}>Уд.</button>
      </td>
    </tr>
  );
}
