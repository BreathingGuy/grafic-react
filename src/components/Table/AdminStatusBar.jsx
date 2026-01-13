import { memo, useMemo } from 'react';
import { useSelectionStore } from '../../store/selectionStore';
import { useAdminStore } from '../../store/adminStore';

/**
 * AdminStatusBar - Статус-бар с информацией о выделении
 *
 * Подписан только на данные выделения, не вызывает ререндер таблицы.
 */
const AdminStatusBar = memo(() => {
  const statusMessage = useSelectionStore(s => s.statusMessage);
  const startCell = useSelectionStore(s => s.startCell);
  const endCell = useSelectionStore(s => s.endCell);
  const employeeIds = useAdminStore(s => s.employeeIds);

  // Вычисляем количество выбранных ячеек
  const selectedCount = useMemo(() => {
    if (!startCell || !endCell || employeeIds.length === 0) return 0;
    return useSelectionStore.getState().getSelectedCount(employeeIds);
  }, [startCell, endCell, employeeIds]);

  const displayText = statusMessage
    || (selectedCount > 0 ? `Выбрано: ${selectedCount} ячеек` : 'Выделите ячейки для редактирования');

  return (
    <div style={{
      marginBottom: '12px',
      padding: '8px 12px',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
      fontSize: '14px',
      display: 'flex',
      justifyContent: 'space-between'
    }}>
      <span>{displayText}</span>
      <span style={{ color: '#666' }}>
        Ctrl+C копировать | Ctrl+V вставить | Ctrl+Z отменить | Esc снять выделение
      </span>
    </div>
  );
});

AdminStatusBar.displayName = 'AdminStatusBar';

export default AdminStatusBar;
