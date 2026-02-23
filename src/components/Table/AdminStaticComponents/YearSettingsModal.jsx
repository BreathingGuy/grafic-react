import { useState, Fragment } from 'react';
import { useAdminStore, useHoursStore } from '../../../store/admin';
import { usePostWebStore } from '../../../store/postWebStore';
import { MONTHS } from '../../../constants';
import s from './Modal.module.css';

/**
 * YearSettingsModal — настройка норм часов по месяцам для года
 * 12 месяцев + автосуммы кварталов + кнопка Сохранить
 */
export default function YearSettingsModal({ isOpen, onClose }) {
  const editingYear = useAdminStore(s => s.editingYear);
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);
  const storeNorms = useHoursStore(s => s.monthNorms);

  const [draftNorms, setDraftNorms] = useState({});
  const [initialized, setInitialized] = useState(false);

  // Инициализация при открытии
  if (isOpen && !initialized) {
    setDraftNorms({ ...storeNorms });
    setInitialized(true);
  }
  if (!isOpen && initialized) {
    setInitialized(false);
  }

  // Ключ месяца: "2025-01"
  const monthKey = (monthIdx) => {
    const m = String(monthIdx + 1).padStart(2, '0');
    return `${editingYear}-${m}`;
  };

  const getValue = (monthIdx) => draftNorms[monthKey(monthIdx)] ?? '';

  const setValue = (monthIdx, val) => {
    setDraftNorms(prev => ({
      ...prev,
      [monthKey(monthIdx)]: val === '' ? '' : Number(val)
    }));
  };

  // Суммы кварталов (вычисляется при каждом рендере — 12 сложений)
  const quarterSums = [0, 0, 0, 0];
  for (let q = 0; q < 4; q++) {
    for (let m = q * 3; m < q * 3 + 3; m++) {
      const v = draftNorms[monthKey(m)];
      quarterSums[q] += (typeof v === 'number' ? v : 0);
    }
  }

  const yearTotal = quarterSums[0] + quarterSums[1] + quarterSums[2] + quarterSums[3];

  const handleSave = () => {
    // Очистить пустые значения → 0
    const cleaned = {};
    for (let i = 0; i < 12; i++) {
      const key = monthKey(i);
      const val = draftNorms[key];
      cleaned[key] = typeof val === 'number' ? val : 0;
    }

    useHoursStore.setState({ monthNorms: cleaned });
    usePostWebStore.getState().saveMonthNorms(editingDepartmentId, editingYear, cleaned);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={`${s.modal} ${s.modalNarrow}`} onClick={e => e.stopPropagation()}>
        <div className={s.header}>
          <h3 className={s.headerTitle}>Нормы часов — {editingYear}</h3>
          <button onClick={onClose} className={s.closeButton}>&times;</button>
        </div>

        <div className={s.content}>
          <table className={s.table}>
            <thead>
              <tr>
                <th className={s.th}>Месяц</th>
                <th className={s.th}>Норма (часы)</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((name, idx) => {
                const isQuarterEnd = (idx + 1) % 3 === 0;
                const quarterIdx = Math.floor(idx / 3);

                return (
                  <Fragment key={idx}>
                    <tr>
                      <td className={s.td}>
                        <span className={s.capitalize}>{name}</span>
                      </td>
                      <td className={s.td}>
                        <input
                          type="number"
                          value={getValue(idx)}
                          onChange={e => setValue(idx, e.target.value)}
                          className={s.input}
                          min={0}
                          placeholder="0"
                        />
                      </td>
                    </tr>
                    {isQuarterEnd && (
                      <tr className={s.quarterRow}>
                        <td className={s.quarterTd}>
                          <strong>Квартал {quarterIdx + 1}</strong>
                        </td>
                        <td className={s.quarterTd}>
                          <strong>{quarterSums[quarterIdx]}</strong>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              <tr className={s.totalRow}>
                <td className={s.quarterTd}><strong>Итого за год</strong></td>
                <td className={s.quarterTd}><strong>{yearTotal}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={s.footer}>
          <button onClick={handleSave} className={s.saveBtn}>Сохранить</button>
          <button onClick={onClose} className={s.cancelBtn}>Отмена</button>
        </div>
      </div>
    </div>
  );
}