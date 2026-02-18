import { memo, useCallback } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { useMetaStore } from '../../../store/metaStore';
import { useDateAdminStore } from '../../../store/dateAdminStore';
import { useClipboardStore } from '../../../store/selection';

/**
 * AdminScheduleCell - Ячейка расписания для админ-режима
 *
 * Редактирование: через SelectionOverlay (drag-выделение) или Ctrl+C/V
 *
 * @param {string} tableId - 'main' | 'offset' для выбора slotToDate из store
 * @param {Function} useSelectionStore - хук selection store
 */
const AdminScheduleCell = memo(({ employeeId, slotIndex, empIdx, tableId = 'main', useSelectionStore }) => {
  const date = useDateAdminStore(state =>
    tableId === 'offset'
      ? state.offsetSlotToDate[slotIndex]
      : state.slotToDate[slotIndex]
  );

  const status = useAdminStore(state => {
    if (!date) return '';
    return state.draftSchedule[`${employeeId}-${date}`] ?? '';
  });

  const colorBack = useMetaStore(state => state.statusColorMap?.[status]?.colorBack);
  const colorText = useMetaStore(state => state.statusColorMap?.[status]?.colorText);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    useClipboardStore.getState().setActiveTable(tableId);
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

  if (!date) return <td />;

  return (
    <td
      data-emp-idx={empIdx}
      data-slot={slotIndex}
      style={{ backgroundColor: colorBack, color: colorText }}
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
      onMouseUp={handleMouseUp}
    >
      {status}
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
