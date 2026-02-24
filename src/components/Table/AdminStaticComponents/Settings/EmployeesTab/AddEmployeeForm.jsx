import { useState } from 'react';
import s from '../Settings.module.css';

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
    <div className={s.addForm}>
      <h4 className={s.formHeading}>Новый сотрудник</h4>
      <div className={s.formRow}>
        <input
          placeholder="ID"
          value={form.id}
          onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
          className={s.input}
          style={{ width: '80px' }}
        />
        <input
          placeholder="Краткое имя"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className={s.input}
        />
        <input
          placeholder="Полное имя"
          value={form.fullName}
          onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
          className={s.input}
        />
        <input
          placeholder="Должность"
          value={form.position}
          onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
          className={s.input}
        />
      </div>
      <div className={s.formActions}>
        <button onClick={handleAdd} className={s.smallBtn}>Добавить</button>
        <button onClick={onCancel} className={s.smallBtnGray}>Отмена</button>
      </div>
    </div>
  );
}
