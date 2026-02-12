import { useState } from 'react';
import { inputStyle, smallBtnStyle, smallBtnGrayStyle, addFormStyle } from '../settingsStyles';

/**
 * AddEmployeeForm — форма добавления нового сотрудника
 * Props: onAdd(formData), onCancel
 */
export default function AddEmployeeForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({ id: '', name: '', fullName: '', position: '' });

  const handleAdd = () => {
    onAdd(form);
    setForm({ id: '', name: '', fullName: '', position: '' });
  };

  return (
    <div style={addFormStyle}>
      <h4 style={{ margin: '0 0 8px 0' }}>Новый сотрудник</h4>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input
          placeholder="ID"
          value={form.id}
          onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
          style={{ ...inputStyle, width: '80px' }}
        />
        <input
          placeholder="Краткое имя"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          style={inputStyle}
        />
        <input
          placeholder="Полное имя"
          value={form.fullName}
          onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
          style={inputStyle}
        />
        <input
          placeholder="Должность"
          value={form.position}
          onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
          style={inputStyle}
        />
      </div>
      <div style={{ marginTop: '8px' }}>
        <button onClick={handleAdd} style={smallBtnStyle}>Добавить</button>
        <button onClick={onCancel} style={smallBtnGrayStyle}>Отмена</button>
      </div>
    </div>
  );
}
