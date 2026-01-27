import { memo, useState, useCallback } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { useDateAdminStore } from '../../../store/dateAdminStore';
import { useClipboardStore, useMainSelectionStore } from '../../../store/selection';
import CellEditor from './CellEditor';

/**
 * MainAdminScheduleCell - Ячейка для main таблицы (январь-декабрь)
 * Использует useMainSelectionStore напрямую, без props drilling
 */
const MainAdminScheduleCell = memo(({ employeeId, slotIndex, empIdx }) => {
  const date = useDateAdminStore(state => state.slotToDate[slotIndex]);

  const status = useAdminStore(state => {
    if (!date) return '';
    return state.draftSchedule[`${employeeId}-${date}`] ?? '';
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    useClipboardStore.getState().setActiveTable('main');
    useMainSelectionStore.getState().startSelection(employeeId, slotIndex, e.ctrlKey || e.metaKey);
  }, [employeeId, slotIndex]);

  const handleMouseOver = useCallback(() => {
    if (!useMainSelectionStore.getState().isDragging) return;
    useMainSelectionStore.getState().updateSelection(employeeId, slotIndex);
  }, [employeeId, slotIndex]);

  const handleMouseUp = useCallback(() => {
    if (useMainSelectionStore.getState().isDragging) {
      useMainSelectionStore.getState().endSelection();
    }
  }, []);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleChange = useCallback((newValue) => {
    if (date) {
      const { saveUndoState, updateDraftCell } = useAdminStore.getState();
      saveUndoState();
      updateDraftCell(employeeId, date, newValue);
    }
    setIsEditing(false);
  }, [employeeId, date]);

  const handleClose = useCallback(() => {
    setIsEditing(false);
  }, []);

  if (!date) return <td />;

  return (
    <td
      data-emp-idx={empIdx}
      data-slot={slotIndex}
      style={{ position: 'relative' }}
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {status}
      {isEditing && (
        <CellEditor value={status} onChange={handleChange} onClose={handleClose} />
      )}
    </td>
  );
}, (prev, next) =>
  prev.employeeId === next.employeeId &&
  prev.slotIndex === next.slotIndex &&
  prev.empIdx === next.empIdx
);

MainAdminScheduleCell.displayName = 'MainAdminScheduleCell';

export default MainAdminScheduleCell;
