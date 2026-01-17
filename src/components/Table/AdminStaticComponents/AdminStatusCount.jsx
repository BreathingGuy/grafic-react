import { useMemo } from 'react';
import { useSelectionStore } from '../../../store/selectionStore';
import { useAdminStore } from '../../../store/adminStore';


const AdminStatusCount = () => {
  const startCell = useSelectionStore(s => s.startCell);
  const endCell = useSelectionStore(s => s.endCell);
  const employeeIds = useAdminStore(s => s.employeeIds);

  // Вычисляем количество выбранных ячеек
  const selectedCount = useMemo(() => {
    if (!startCell || !endCell || employeeIds.length === 0) return 0;
    return useSelectionStore.getState().getSelectedCount(employeeIds);
  }, [startCell, endCell, employeeIds]);

  return (
    <span>Выбрано {selectedCount} ячеек</span>
  );
};

AdminStatusCount.displayName = 'AdminStatusCount';

export default AdminStatusCount;