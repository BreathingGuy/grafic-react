import { useState } from 'react';
import { tdStyle, inputStyle, smallBtnStyle, smallBtnGrayStyle, smallBtnRedStyle } from '../settingsStyles';

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
    <tr>
      <td style={tdStyle}>{empId}</td>
      <td style={tdStyle}>{employee.name}</td>
      <td style={tdStyle}>{employee.fullName}</td>
      <td style={tdStyle}>{employee.position}</td>
      <td style={tdStyle}>
        <button onClick={startEdit} style={smallBtnStyle}>Ред.</button>
        <button onClick={() => onDelete(empId)} style={smallBtnRedStyle}>Уд.</button>
      </td>
    </tr>
  );
}
