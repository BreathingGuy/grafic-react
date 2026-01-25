import { memo, useState, useCallback } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { useDateAdminStore } from '../../../store/dateAdminStore';
import { useClipboardStore } from '../../../store/selection';
import CellEditor from './CellEditor';

/**
 * AdminScheduleCell - Ячейка без подписки на selection
 *
 * Выделение отрисовывается через SelectionOverlay.
 * Для единичной ячейки редактор открывается по двойному клику.
 *
 * @param {string} tableId - 'main' | 'offset' для выбора slotToDate из store
 * @param {Function} useSelectionStore - хук selection store (useMainSelectionStore или useOffsetSelectionStore)
 */
const AdminScheduleCell = memo(({ employeeId, slotIndex, empIdx, tableId = 'main', useSelectionStore }) => {
  // Берём дату напрямую из store в зависимости от tableId
  // Это гарантирует ререндер при смене года
  const date = useDateAdminStore(state =>
    tableId === 'offset'
      ? state.offsetSlotToDate[slotIndex]
      : state.slotToDate[slotIndex]
  );

  // Читаем из adminStore.draftSchedule
  const status = useAdminStore(state => {
    if (!date) return '';
    return state.draftSchedule[`${employeeId}-${date}`] ?? '';
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    // Устанавливаем активную таблицу в clipboardStore
    useClipboardStore.getState().setActiveTable(tableId);
    // Начинаем выделение в переданном сторе
    useSelectionStore.getState().startSelection(employeeId, slotIndex, e.ctrlKey || e.metaKey);
  }, [employeeId, slotIndex, tableId, useSelectionStore]);

  const handleMouseOver = useCallback(() => {
    if (!useSelectionStore.getState().isDragging) return;
    useSelectionStore.getState().updateSelection(employeeId, slotIndex);
  }, [employeeId, slotIndex, useSelectionStore]);

  const handleMouseUp = useCallback(() => {
    if (useSelectionStore.getState().isDragging) {
      useSelectionStore.getState().endSelection();
    }
  }, [useSelectionStore]);

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
  prev.empIdx === next.empIdx &&
  prev.tableId === next.tableId &&
  prev.useSelectionStore === next.useSelectionStore
);

AdminScheduleCell.displayName = 'AdminScheduleCell';

export default AdminScheduleCell;
