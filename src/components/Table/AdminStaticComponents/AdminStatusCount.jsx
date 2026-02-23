import { memo } from 'react';
import { useMainSelectionStore, useOffsetSelectionStore, useClipboardStore } from '../../../store/selection';
import { useAdminStore } from '../../../store/admin';

/**
 * AdminStatusCount - Показывает количество выделенных ячеек
 * Подписывается только на активный selection store (не на оба сразу)
 */
const AdminStatusCount = memo(() => {
  const activeTableId = useClipboardStore(s => s.activeTableId);
  const employeeIds = useAdminStore(s => s.employeeIds, Object.is);

  // Подписываемся только на активный стор
  const useActiveStore = activeTableId === 'offset' ? useOffsetSelectionStore : useMainSelectionStore;
  const startCell = useActiveStore(s => s.startCell);
  const endCell = useActiveStore(s => s.endCell);

  let selectedCount = 0;
  if (startCell && endCell && employeeIds.length > 0) {
    selectedCount = useActiveStore.getState().getSelectedCount(employeeIds);
  }

  return (
    <span>Выбрано {selectedCount} ячеек</span>
  );
});

AdminStatusCount.displayName = 'AdminStatusCount';

export default AdminStatusCount;
