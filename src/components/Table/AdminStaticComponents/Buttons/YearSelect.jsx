import { memo, useEffect } from 'react';
import { useAdminStore } from '../../../../store/admin';
import { switchYear } from '../../../../services/adminOrchestrator';
import s from '../AdminPanel.module.css';

/**
 * YearSelect — выпадающий список годов
 * Загружает список доступных годов при монтировании
 */
const YearSelect = memo(() => {
  const editingYear = useAdminStore(s => s.editingYear);
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);
  const availableYears = useAdminStore(s => s.availableYears);
  const loadingYears = useAdminStore(s => s.loadingYears);
  const hasUnsavedChanges = useAdminStore(s => s.hasUnsavedChanges);

  useEffect(() => {
    if (editingDepartmentId && availableYears.length === 0) {
      useAdminStore.getState().loadAvailableYears(editingDepartmentId);
    }
  }, [editingDepartmentId, availableYears.length]);

  const handleYearChange = async (e) => {
    const newYear = e.target.value;
    if (newYear === String(editingYear)) return;

    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Есть несохранённые изменения. Переключить год без сохранения?'
      );
      if (!confirmed) return;
    }

    await switchYear(newYear);
  };

  return (
    <div className={s.selectGroup}>
      <label className={s.selectLabel}>Год:</label>
      <select
        value={editingYear || ''}
        onChange={handleYearChange}
        disabled={loadingYears}
        className={s.select}
      >
        {loadingYears ? (
          <option>Загрузка...</option>
        ) : (
          availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))
        )}
      </select>
    </div>
  );
});

YearSelect.displayName = 'YearSelect';

export default YearSelect;
