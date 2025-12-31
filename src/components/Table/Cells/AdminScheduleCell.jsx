import { memo, useState, useCallback } from 'react';
import { useScheduleStore } from '../../../store/scheduleStore';
import { useDateStore } from '../../../store/dateStore';
import { useSelectionStore } from '../../../store/selectionStore';
import CellEditor from './CellEditor';

/**
 * AdminScheduleCell - Ячейка без подписки на selection
 *
 * Выделение отрисовывается через SelectionOverlay,
 * эта ячейка только обрабатывает mouse события.
 */
const AdminScheduleCell = memo(({ employeeId, slotIndex, empIdx }) => {
  const date = useDateStore(state => state.slotToDate[slotIndex]);

  const status = useScheduleStore(state => {
    if (!date) return '';
    return state.draftSchedule?.[`${employeeId}-${date}`] ?? state.scheduleMap[`${employeeId}-${date}`] ?? '';
  });

  const [isEditing, setIsEditing] = useState(false);

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

  const handleDoubleClick = useCallback(() => setIsEditing(true), []);

  const handleChange = useCallback((newStatus) => {
    if (date) useScheduleStore.getState().updateDraftCell(employeeId, date, newStatus);
    setIsEditing(false);
  }, [employeeId, date]);

  if (!date) return <td />;

  return (
    <td
      data-emp-idx={empIdx}
      data-slot={slotIndex}
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <CellEditor value={status} onChange={handleChange} onClose={() => setIsEditing(false)} />
      ) : (
        status
      )}
    </td>
  );
}, (prev, next) => prev.employeeId === next.employeeId && prev.slotIndex === next.slotIndex && prev.empIdx === next.empIdx);

AdminScheduleCell.displayName = 'AdminScheduleCell';

export default AdminScheduleCell;
