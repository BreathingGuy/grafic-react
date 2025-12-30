import { memo, useState, useMemo, useCallback } from 'react';
import { useScheduleStore } from '../../../store/scheduleStore';
import { useDateStore } from '../../../store/dateStore';
import { useSelectionStore } from '../../../store/selectionStore';
import CellEditor from './CellEditor';

// Цвета статусов
const STATUS_COLORS = {
  'Д': '#d4edda',
  'В': '#f8d7da',
  'У': '#fff3cd',
  'О': '#d1ecf1',
  'ОВ': '#d1ecf1',
  'Н1': '#9c27b0',
  'Н2': '#9c27b0',
  'ЭУ': '#ff9800',
};

const WHITE_TEXT_STATUSES = new Set(['Н1', 'Н2', 'ЭУ']);

/**
 * AdminScheduleCell - Оптимизированная ячейка для админского редактирования
 *
 * Оптимизации:
 * - Подписка только на свой isSelected (O(1) через объект)
 * - Все actions через getState() — без подписки
 * - Нет подписки на isDragging
 */
const AdminScheduleCell = memo(({ employeeId, slotIndex }) => {
  const cellKey = `${employeeId}-${slotIndex}`;

  // Получаем дату из слота
  const date = useDateStore(state => state.slotToDate[slotIndex]);

  // Получаем статус из draftSchedule
  const status = useScheduleStore(state => {
    if (!date) return '';
    const key = `${employeeId}-${date}`;
    return state.draftSchedule?.[key] ?? state.scheduleMap[key] ?? '';
  });

  // O(1) проверка выделения — подписка только на конкретный ключ
  const isSelected = useSelectionStore(state => !!state.selectedCells[cellKey]);

  // Локальное состояние редактирования
  const [isEditing, setIsEditing] = useState(false);

  // === ВСЕ ОБРАБОТЧИКИ через getState() — НЕТ подписок на actions/isDragging ===

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    useSelectionStore.getState().startSelection(employeeId, slotIndex);
  }, [employeeId, slotIndex]);

  const handleMouseOver = useCallback(() => {
    if (!useSelectionStore.getState().isDragging) return;
    const { employeeIds } = useScheduleStore.getState();
    const { visibleSlots } = useDateStore.getState();
    useSelectionStore.getState().updateSelection(employeeId, slotIndex, employeeIds, visibleSlots);
  }, [employeeId, slotIndex]);

  const handleMouseUp = useCallback(() => {
    if (useSelectionStore.getState().isDragging) {
      useSelectionStore.getState().endSelection();
    }
  }, []);

  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    setIsEditing(true);
  }, []);

  const handleChange = useCallback((newStatus) => {
    if (date) {
      useScheduleStore.getState().updateDraftCell(employeeId, date, newStatus);
    }
    setIsEditing(false);
  }, [employeeId, date]);

  // === СТИЛИ ===
  const cellStyle = useMemo(() => ({
    backgroundColor: STATUS_COLORS[status] || 'transparent',
    color: WHITE_TEXT_STATUSES.has(status) ? 'white' : 'black',
    outline: isSelected ? '2px solid #007bff' : 'none',
    outlineOffset: '-2px',
    cursor: 'cell',
    userSelect: 'none'
  }), [status, isSelected]);

  if (!date) return <td></td>;

  return (
    <td
      style={cellStyle}
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      {isEditing ? (
        <CellEditor
          value={status}
          onChange={handleChange}
          onClose={() => setIsEditing(false)}
        />
      ) : (
        status
      )}
    </td>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.employeeId === nextProps.employeeId &&
    prevProps.slotIndex === nextProps.slotIndex
  );
});

AdminScheduleCell.displayName = 'AdminScheduleCell';

export default AdminScheduleCell;