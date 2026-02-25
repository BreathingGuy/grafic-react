import { useState, useCallback, useEffect, useRef, memo } from 'react';
import s from '../Settings.module.css';

const emptyAddForm = {
  code: '', label: '', hours: 0,
  colorText: '#000000', colorBack: '#ffffff', descriptin: ''
};

/**
 * ColorField — изолированный color picker
 * Uncontrolled input + нативный 'change' (срабатывает только при фиксации цвета,
 * не на каждом движении) → ноль React-рендеров во время перемещения
 */
const ColorField = memo(({ defaultValue, onCommit, className }) => {
  const inputRef = useRef(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  useEffect(() => {
    const el = inputRef.current;
    const handler = (e) => onCommitRef.current(e.target.value);
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, []); // только mount/unmount

  return (
    <input
      ref={inputRef}
      type="color"
      defaultValue={defaultValue}
      className={className}
    />
  );
});

ColorField.displayName = 'ColorField';

/**
 * StatusEditRow — строка редактирования с изолированным editForm
 * Перерисовывается только при фиксации цвета, не при перемещении
 */
const StatusEditRow = memo(({ status, onSave, onCancel }) => {
  const [editForm, setEditForm] = useState({ ...status });

  const handleColorText = useCallback(
    (val) => setEditForm(f => ({ ...f, colorText: val })), []
  );
  const handleColorBack = useCallback(
    (val) => setEditForm(f => ({ ...f, colorBack: val })), []
  );

  return (
    <tr>
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
        <ColorField
          defaultValue={editForm.colorText || '#000000'}
          onCommit={handleColorText}
          className={s.colorInput}
        />
      </td>
      <td className={s.td}>
        <ColorField
          defaultValue={editForm.colorBack || '#ffffff'}
          onCommit={handleColorBack}
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
        <button onClick={() => onSave(editForm)} className={s.smallBtn}>Ок</button>
        <button onClick={onCancel} className={s.smallBtnGray}>Отм.</button>
      </td>
    </tr>
  );
});

StatusEditRow.displayName = 'StatusEditRow';

/**
 * StatusDisplayRow — строка отображения (memo)
 * Не перерисовывается при изменении editForm в StatusEditRow
 */
const StatusDisplayRow = memo(({ status, idx, onEdit, onDelete }) => (
  <tr>
    <td className={s.td}><strong>{status.code}</strong></td>
    <td className={s.td}>{status.label}</td>
    <td className={s.td}>{status.hours ?? '—'}</td>
    <td className={s.td}>
      <span className={s.colorSwatch} style={{ backgroundColor: status.colorText || '#000' }} />
    </td>
    <td className={s.td}>
      <span className={s.colorSwatch} style={{ backgroundColor: status.colorBack || '#fff' }} />
    </td>
    <td className={s.td}>{status.descriptin}</td>
    <td className={s.td}>
      <button onClick={() => onEdit(idx)} className={s.smallBtn}>Ред.</button>
      <button onClick={() => onDelete(idx, status.code)} className={s.smallBtnRed}>Уд.</button>
    </td>
  </tr>
));

StatusDisplayRow.displayName = 'StatusDisplayRow';

/**
 * StatusesTab — вкладка обозначений (controlled)
 * Props: statuses (массив), onChange (сеттер массива)
 */
export default function StatusesTab({ statuses, onChange }) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyAddForm });

  const startEdit = useCallback((idx) => {
    setEditingIdx(idx);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingIdx(null);
  }, []);

  const saveEdit = useCallback((editForm) => {
    onChange(prev => {
      const next = [...prev];
      next[editingIdx] = { ...editForm };
      return next;
    });
    setEditingIdx(null);
  }, [editingIdx, onChange]);

  const deleteStatus = useCallback((idx, code) => {
    if (!window.confirm(`Удалить обозначение "${code}"?`)) return;
    onChange(prev => prev.filter((_, i) => i !== idx));
  }, [onChange]);

  const handleAddColorText = useCallback(
    (val) => setAddForm(f => ({ ...f, colorText: val })), []
  );
  const handleAddColorBack = useCallback(
    (val) => setAddForm(f => ({ ...f, colorBack: val })), []
  );

  const addStatus = () => {
    if (!addForm.code) return;
    onChange([...statuses, { ...addForm }]);
    setAddForm({ ...emptyAddForm });
    setShowAddForm(false);
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
            {statuses.map((status, idx) =>
              editingIdx === idx ? (
                <StatusEditRow
                  key={idx}
                  status={status}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                />
              ) : (
                <StatusDisplayRow
                  key={idx}
                  status={status}
                  idx={idx}
                  onEdit={startEdit}
                  onDelete={deleteStatus}
                />
              )
            )}
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
              Текст: <ColorField
                defaultValue={addForm.colorText}
                onCommit={handleAddColorText}
                className={s.colorInput}
              />
            </label>
            <label className={s.colorLabel}>
              Фон: <ColorField
                defaultValue={addForm.colorBack}
                onCommit={handleAddColorBack}
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
