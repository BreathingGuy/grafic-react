import { memo } from 'react';
import { useAdminStore } from '../../../../store/adminStore';

/**
 * YearSelect — выпадающий список годов
 * Загрузка годов происходит в enterAdminContext, компонент только отображает
 */
const YearSelect = memo(() => {
  const editingYear = useAdminStore(s => s.editingYear);
  const availableYears = useAdminStore(s => s.availableYears);
  const loadingYears = useAdminStore(s => s.loadingYears);
  const hasUnsavedChanges = useAdminStore(s => s.hasUnsavedChanges);

  const handleYearChange = async (e) => {
    const newYear = e.target.value;
    if (newYear === String(editingYear)) return;

    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Есть несохранённые изменения. Переключить год без сохранения?'
      );
      if (!confirmed) return;
    }

    await useAdminStore.getState().switchYear(newYear);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ fontWeight: 500 }}>Год:</label>
      <select
        value={editingYear || ''}
        onChange={handleYearChange}
        disabled={loadingYears}
        style={{
          padding: '6px 12px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          fontSize: '14px',
          minWidth: '100px'
        }}
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
