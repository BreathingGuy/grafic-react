import { memo, useState, useCallback, useMemo } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { useDateAdminStore } from '../../../store/dateAdminStore';
import { useSelectionStore } from '../../../store/selectionStore';
import { useMetaStore } from '../../../store/metaStore';
import CellEditor from './CellEditor';

/**
 * AdminScheduleCell - Ячейка без подписки на selection
 *
 * Выделение отрисовывается через SelectionOverlay.
 * Для единичной ячейки редактор открывается по двойному клику.
 *
 * @param {string} tableId - 'main' | 'offset' для выбора slotToDate из store
 */
const AdminScheduleCell = memo(({ employeeId, slotIndex, empIdx, tableId = 'main' }) => {
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

  // Получаем конфигурацию статусов из metaStore
  const statusConfig = useMetaStore(state => state.currentDepartmentConfig?.statusConfig);

  // Вычисляем стили на основе конфигурации статусов
  const cellStyle = useMemo(() => {
    if (!status || !statusConfig) return {};

    // Ищем конфигурацию для текущего статуса
    const config = statusConfig.find(s =>
      s.codeList === status || s.code === status
    );

    if (!config) return {};

    return {
      backgroundColor: config.colorBackground || config.color || undefined,
      color: config.colorText || undefined
    };
  }, [status, statusConfig]);

  const [isEditing, setIsEditing] = useState(false);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    useSelectionStore.getState().startSelection(employeeId, slotIndex, e.ctrlKey || e.metaKey, tableId);
  }, [employeeId, slotIndex, tableId]);

  const handleMouseOver = useCallback(() => {
    if (!useSelectionStore.getState().isDragging) return;
    useSelectionStore.getState().updateSelection(employeeId, slotIndex);
  }, [employeeId, slotIndex]);

  const handleMouseUp = useCallback(() => {
    if (useSelectionStore.getState().isDragging) {
      useSelectionStore.getState().endSelection();
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
      style={{
        position: 'relative',
        ...cellStyle
      }}
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
}, (prev, next) => prev.employeeId === next.employeeId && prev.slotIndex === next.slotIndex && prev.empIdx === next.empIdx && prev.tableId === next.tableId);

AdminScheduleCell.displayName = 'AdminScheduleCell';

export default AdminScheduleCell;
