import { memo, useCallback } from 'react';
import { useScheduleStore } from '../../../store/scheduleStore';
import { useDateStore } from '../../../store/dateStore';
import { useSelectionStore } from '../../../store/selectionStore';

/**
 * AdminScheduleCell - Ячейка без подписки на selection
 *
 * Выделение и редактирование через SelectionOverlay,
 * эта ячейка только обрабатывает mouse события.
 */
const AdminScheduleCell = memo(({ employeeId, slotIndex, empIdx }) => {
  const date = useDateStore(state => state.slotToDate[slotIndex]);

  const status = useScheduleStore(state => {
    if (!date) return '';
    return state.draftSchedule?.[`${employeeId}-${date}`] ?? state.scheduleMap[`${employeeId}-${date}`] ?? '';
  });

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    useSelectionStore.getState().startSelection(employeeId, slotIndex);
  }, [employeeId, slotIndex]);

  const handleMouseOver = useCallback(() => {
    if (!useSelectionStore.getState().isDragging) return;
    useSelectionStore.getState().updateSelection(employeeId, slotIndex);
  }, [employeeId, slotIndex]);

  const handleMouseUp = useCallback(() => {
    if (useSelectionStore.getState().isDragging) {
      useSelectionStore.getState().endSelection();
    }
  }, []);

  if (!date) return <td />;

  return (
    <td
      data-emp-idx={empIdx}
      data-slot={slotIndex}
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
      onMouseUp={handleMouseUp}
    >
      {status}
    </td>
  );
}, (prev, next) => prev.employeeId === next.employeeId && prev.slotIndex === next.slotIndex && prev.empIdx === next.empIdx);

AdminScheduleCell.displayName = 'AdminScheduleCell';

export default AdminScheduleCell;
