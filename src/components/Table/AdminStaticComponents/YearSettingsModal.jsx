import { useState, Fragment } from 'react';
import { useAdminStore, useHoursStore } from '../../../store/admin';
import { usePostWebStore } from '../../../store/postWebStore';
import { MONTHS } from '../../../constants';
import css from './Modal.module.css';

/**
 * YearSettingsModal — настройка норм часов по месяцам для года
 * 12 месяцев + автосуммы кварталов + кнопка Сохранить
 */
export default function YearSettingsModal({ isOpen, onClose }) {
  const editingYear = useAdminStore(s => s.editingYear);
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);
  const storeNorms = useHoursStore(s => s.monthNorms);

  const [activeTab, setActiveTab] = useState('norms');
  const [draftNorms, setDraftNorms] = useState({});
  const [initialized, setInitialized] = useState(false);

  // Инициализация при открытии
  if (isOpen && !initialized) {
    setDraftNorms({ ...storeNorms });
    setInitialized(true);
  }
  if (!isOpen && initialized) {
    setInitialized(false);
    setActiveTab('norms');
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
    <div className={css.overlay} onClick={onClose}>
      <div className={`${css.modal} ${css.modalNarrow}`} onClick={e => e.stopPropagation()}>
        <div className={css.header}>
          <h3 className={css.headerTitle}>Настройки года</h3>
          <button onClick={onClose} className={css.closeButton}>&times;</button>
        </div>

        <div className={css.tabs}>
          <button
            className={activeTab === 'norms' ? css.tabActive : css.tab}
            onClick={() => setActiveTab('norms')}
          >
            Нормы часов
          </button>
          <button
            className={activeTab === 'holidays' ? css.tabActive : css.tab}
            onClick={() => setActiveTab('holidays')}
          >
            Праздники
          </button>
        </div>

        <div className={css.content}>
          {activeTab === 'norms' && (
            <table className={css.table}>
              <thead>
                <tr>
                  <th className={css.th}>Месяц</th>
                  <th className={css.th}>Норма (часы)</th>
                </tr>
              </thead>
              <tbody>
                {MONTHS.map((name, idx) => {
                  const isQuarterEnd = (idx + 1) % 3 === 0;
                  const quarterIdx = Math.floor(idx / 3);

                  return (
                    <Fragment key={idx}>
                      <tr>
                        <td className={css.td}>
                          <span className={css.capitalize}>{name}</span>
                        </td>
                        <td className={css.td}>
                          <input
                            type="number"
                            value={getValue(idx)}
                            onChange={e => setValue(idx, e.target.value)}
                            className={css.input}
                            min={0}
                            placeholder="0"
                          />
                        </td>
                      </tr>
                      {isQuarterEnd && (
                        <tr className={css.quarterRow}>
                          <td className={css.quarterTd}>
                            <strong>Квартал {quarterIdx + 1}</strong>
                          </td>
                          <td className={css.quarterTd}>
                            <strong>{quarterSums[quarterIdx]}</strong>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                <tr className={css.totalRow}>
                  <td className={css.quarterTd}><strong>Итого за год</strong></td>
                  <td className={css.quarterTd}><strong>{yearTotal}</strong></td>
                </tr>
              </tbody>
            </table>
          )}

          {activeTab === 'holidays' && (
            <div className={css.tabPlaceholder}>
              Праздники — будет добавлено позже
            </div>
          )}
        </div>

        <div className={css.footer}>
          {activeTab === 'norms' && (
            <button onClick={handleSave} className={css.saveBtn}>Сохранить</button>
          )}
          <button onClick={onClose} className={css.cancelBtn}>Отмена</button>
        </div>
      </div>
    </div>
  );
}