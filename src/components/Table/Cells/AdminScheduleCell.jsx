import { memo, useState, useMemo, useCallback } from 'react';
import { useScheduleStore } from '../../../store/scheduleStore';
import { useDateStore } from '../../../store/dateStore';
import { useSelectionStore } from '../../../store/selectionStore';
import CellEditor from './CellEditor';
import styles from '../Table.module.css';

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
 * AdminScheduleCell - Ячейка для админского редактирования
 *
 * Поддерживает:
 * - Drag-выделение (mousedown → mouseover → mouseup)
 * - Подсветку выделенных ячеек
 * - Редактирование по двойному клику
 */
const AdminScheduleCell = memo(({ employeeId, slotIndex }) => {
  // Получаем дату из слота
  const date = useDateStore(state => state.slotToDate[slotIndex]);

  // Получаем статус из draftSchedule
  const status = useScheduleStore(state => {
    if (!date) return '';
    const key = `${employeeId}-${date}`;
    return state.draftSchedule?.[key] ?? state.scheduleMap[key] ?? '';
  });

  // Проверяем, выделена ли ячейка
  const isSelected = useSelectionStore(state =>
    state.selectedCells.some(
      cell => cell.employeeId === employeeId && cell.slotIndex === slotIndex
    )
  );

  const isDragging = useSelectionStore(state => state.isDragging);
  const startSelection = useSelectionStore(state => state.startSelection);
  const updateSelection = useSelectionStore(state => state.updateSelection);
  const endSelection = useSelectionStore(state => state.endSelection);

  // Данные для расчёта выделения
  const employeeIds = useScheduleStore(state => state.employeeIds);
  const visibleSlots = useDateStore(state => state.visibleSlots);

  // Actions
  const updateDraftCell = useScheduleStore(state => state.updateDraftCell);

  // Локальное состояние редактирования
  const [isEditing, setIsEditing] = useState(false);

  // === ОБРАБОТЧИКИ МЫШИ ===

  const handleMouseDown = useCallback((e) => {    
    if (e.button !== 0) return; // Только левая кнопка
    e.preventDefault();
    startSelection(employeeId, slotIndex);
  }, [employeeId, slotIndex, startSelection]);

  const handleMouseOver = useCallback(() => {
    if (!isDragging) return;
    updateSelection(employeeId, slotIndex, employeeIds, visibleSlots);
  }, [isDragging, employeeId, slotIndex, employeeIds, visibleSlots, updateSelection]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      endSelection();
    }
  }, [isDragging, endSelection]);

  // Двойной клик для редактирования
  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    setIsEditing(true);
  }, []);

  // Изменение статуса
  const handleChange = useCallback((newStatus) => {
    if (date && updateDraftCell) {
      updateDraftCell(employeeId, date, newStatus);
    }
    setIsEditing(false);
  }, [updateDraftCell, employeeId, date]);

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
        {status}
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
