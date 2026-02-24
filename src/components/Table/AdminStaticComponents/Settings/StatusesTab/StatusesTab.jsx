import { useState } from 'react';
import s from '../Settings.module.css';

const emptyAddForm = {
  code: '', label: '', hours: 0,
  colorText: '#000000', colorBack: '#ffffff', descriptin: ''
};

/**
 * StatusesTab — вкладка обозначений (controlled)
 * Props: statuses (массив), onChange (сеттер массива)
 */
export default function StatusesTab({ statuses, onChange }) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyAddForm });

  const startEdit = (idx) => {
    setEditForm({ ...statuses[idx] });
    setEditingIdx(idx);
  };

  const cancelEdit = () => {
    setEditingIdx(null);
  };

  const saveEdit = () => {
    const next = [...statuses];
    next[editingIdx] = { ...editForm };
    onChange(next);
    setEditingIdx(null);
  };

  const addStatus = () => {
    if (!addForm.code) return;
    onChange([...statuses, { ...addForm }]);
    setAddForm({ ...emptyAddForm });
    setShowAddForm(false);
  };

  const deleteStatus = (idx) => {
    if (!window.confirm(`Удалить обозначение "${statuses[idx].code}"?`)) return;
    onChange(statuses.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className={s.scrollContainer}>
        <table className={s.table}>
          <thead>
            <tr>
              <th className={s.th}>Код</th>
              <th className={s.th}>Название</th>
              <th className={s.th}>Часы</th>
              <th className={s.th}>Цвет текста</th>
              <th className={s.th}>Цвет фона</th>
              <th className={s.th}>Описание</th>
              <th className={s.th}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((status, idx) => {
              if (editingIdx === idx) {
                return (
                  <tr key={idx}>
                    <td className={s.td}>
                      <input
                        value={editForm.code || ''}
                        onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))}
                        className={s.input}
                        style={{ width: '40px' }}
                      />
                    </td>
                    <td className={s.td}>
                      <input
                        value={editForm.label || ''}
                        onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                        className={s.input}
                      />
                    </td>
                    <td className={s.td}>
                      <input
                        type="number"
                        value={editForm.hours ?? 0}
                        onChange={e => setEditForm(f => ({ ...f, hours: Number(e.target.value) }))}
                        className={s.input}
                        style={{ width: '50px' }}
                        min={0}
                      />
                    </td>
                    <td className={s.td}>
                      <input
                        type="color"
                        value={editForm.colorText || '#000000'}
                        onChange={e => setEditForm(f => ({ ...f, colorText: e.target.value }))}
                        className={s.colorInput}
                      />
                    </td>
                    <td className={s.td}>
                      <input
                        type="color"
                        value={editForm.colorBack || '#ffffff'}
                        onChange={e => setEditForm(f => ({ ...f, colorBack: e.target.value }))}
                        className={s.colorInput}
                      />
                    </td>
                    <td className={s.td}>
                      <input
                        value={editForm.descriptin || ''}
                        onChange={e => setEditForm(f => ({ ...f, descriptin: e.target.value }))}
                        className={s.input}
                      />
                    </td>
                    <td className={s.td}>
                      <button onClick={saveEdit} className={s.smallBtn}>Ок</button>
                      <button onClick={cancelEdit} className={s.smallBtnGray}>Отм.</button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={idx}>
                  <td className={s.td}><strong>{status.code}</strong></td>
                  <td className={s.td}>{status.label}</td>
                  <td className={s.td}>{status.hours ?? '—'}</td>
                  <td className={s.td}>
                    <span
                      className={s.colorSwatch}
                      style={{ backgroundColor: status.colorText || '#000' }}
                    />
                  </td>
                  <td className={s.td}>
                    <span
                      className={s.colorSwatch}
                      style={{ backgroundColor: status.colorBack || '#fff' }}
                    />
                  </td>
                  <td className={s.td}>{status.descriptin}</td>
                  <td className={s.td}>
                    <button onClick={() => startEdit(idx)} className={s.smallBtn}>Ред.</button>
                    <button onClick={() => deleteStatus(idx)} className={s.smallBtnRed}>Уд.</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddForm ? (
        <div className={s.addForm}>
          <h4 className={s.formHeading}>Новое обозначение</h4>
          <div className={s.formRow}>
            <input
              placeholder="Код"
              value={addForm.code}
              onChange={e => setAddForm(f => ({ ...f, code: e.target.value }))}
              className={s.input}
              style={{ width: '50px' }}
            />
            <input
              placeholder="Название"
              value={addForm.label}
              onChange={e => setAddForm(f => ({ ...f, label: e.target.value }))}
              className={s.input}
            />
            <input
              type="number"
              placeholder="Часы"
              value={addForm.hours}
              onChange={e => setAddForm(f => ({ ...f, hours: Number(e.target.value) }))}
              className={s.input}
              style={{ width: '50px' }}
              min={0}
            />
            <label className={s.colorLabel}>
              Текст: <input
                type="color"
                value={addForm.colorText}
                onChange={e => setAddForm(f => ({ ...f, colorText: e.target.value }))}
                className={s.colorInput}
              />
            </label>
            <label className={s.colorLabel}>
              Фон: <input
                type="color"
                value={addForm.colorBack}
                onChange={e => setAddForm(f => ({ ...f, colorBack: e.target.value }))}
                className={s.colorInput}
              />
            </label>
            <input
              placeholder="Описание"
              value={addForm.descriptin}
              onChange={e => setAddForm(f => ({ ...f, descriptin: e.target.value }))}
              className={s.input}
            />
          </div>
          <div className={s.formActions}>
            <button onClick={addStatus} className={s.smallBtn}>Добавить</button>
            <button onClick={() => setShowAddForm(false)} className={s.smallBtnGray}>Отмена</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className={s.addButton}
        >
          + Добавить обозначение
        </button>
      )}
    </div>
  );
}
