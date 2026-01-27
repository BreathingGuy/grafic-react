import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useMainSelectionStore, useOffsetSelectionStore, useClipboardStore } from '../../../store/selection';
import { useAdminStore } from '../../../store/adminStore';

/**
 * AdminStatusCount - Показывает количество выделенных ячеек
 * Отображает выделение из активной таблицы (main или offset)
 */
const AdminStatusCount = () => {
  const activeTableId = useClipboardStore(s => s.activeTableId);
  // Используем shallow comparison для предотвращения лишних перерендеров
  const employeeIds = useAdminStore(s => s.employeeIds, shallow);

  // Подписываемся на обе таблицы
  const mainStartCell = useMainSelectionStore(s => s.startCell);
  const mainEndCell = useMainSelectionStore(s => s.endCell);
  const offsetStartCell = useOffsetSelectionStore(s => s.startCell);
  const offsetEndCell = useOffsetSelectionStore(s => s.endCell);

  // Вычисляем количество выбранных ячеек
  // Подписки на startCell/endCell обеих таблиц нужны для ререндера при изменении выделения
  const selectedCount = useMemo(() => {
    if (employeeIds.length === 0) return 0;

    // Определяем активный стор
    const store = activeTableId === 'offset' ? useOffsetSelectionStore : useMainSelectionStore;
    const { startCell, endCell } = store.getState();

    if (!startCell || !endCell) return 0;
    return store.getState().getSelectedCount(employeeIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTableId, mainStartCell, mainEndCell, offsetStartCell, offsetEndCell, employeeIds]);

  return (
    <span>Выбрано {selectedCount} ячеек</span>
  );
};

AdminStatusCount.displayName = 'AdminStatusCount';

export default AdminStatusCount;
