import { useEffect, useState, useCallback } from 'react';
import { useSelectionStore } from '../../store/selectionStore';
import { useScheduleStore } from '../../store/scheduleStore';
import { useDateStore } from '../../store/dateStore';
import styles from './Table.module.css';

/**
 * SelectionOverlay - Оверлей для визуализации выделения + CellEditor
 *
 * Поддерживает множественное выделение через Ctrl+click.
 */

const statusOptions = [
  { value: '', label: '-' },
  { value: 'Д', label: 'Д (рабочий день)' },
  { value: 'В', label: 'В (выходной)' },
  { value: 'У', label: 'У (учёба)' },
  { value: 'О', label: 'О (отпуск)' },
  { value: 'ОВ', label: 'ОВ (отпуск)' },
  { value: 'Н1', label: 'Н1 (ночь)' },
  { value: 'Н2', label: 'Н2 (ночь)' },
  { value: 'ЭУ', label: 'ЭУ (экстра)' },
];

// Вычислить стиль для одного региона выделения
function computeRegionStyle(startCell, endCell, employeeIds, tableRef) {
  if (!startCell || !endCell || !tableRef?.current) return null;

  const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
  const endEmpIdx = employeeIds.indexOf(endCell.employeeId);

  const minEmpIdx = Math.min(startEmpIdx, endEmpIdx);
  const maxEmpIdx = Math.max(startEmpIdx, endEmpIdx);
  const minSlot = Math.min(startCell.slotIndex, endCell.slotIndex);
  const maxSlot = Math.max(startCell.slotIndex, endCell.slotIndex);

  const topLeftCell = tableRef.current.querySelector(
    `[data-emp-idx="${minEmpIdx}"][data-slot="${minSlot}"]`
  );
  const bottomRightCell = tableRef.current.querySelector(
    `[data-emp-idx="${maxEmpIdx}"][data-slot="${maxSlot}"]`
  );

  if (!topLeftCell || !bottomRightCell) return null;

  const containerRect = tableRef.current.getBoundingClientRect();
  const topLeftRect = topLeftCell.getBoundingClientRect();
  const bottomRightRect = bottomRightCell.getBoundingClientRect();

  return {
    position: 'absolute',
    left: topLeftRect.left - containerRect.left,
    top: topLeftRect.top - containerRect.top,
    width: bottomRightRect.right - topLeftRect.left,
    height: bottomRightRect.bottom - topLeftRect.top,
    border: '2px solid #1976d2',
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    pointerEvents: 'none',
    zIndex: 10,
    boxSizing: 'border-box'
  };
}

function SelectionOverlay({ tableRef }) {
  const [regionStyles, setRegionStyles] = useState([]);
  const [editorPosition, setEditorPosition] = useState(null);
  const [hoveredValue, setHoveredValue] = useState(null);

  // Подписываемся на все выделения
  const startCell = useSelectionStore(s => s.startCell);
  const endCell = useSelectionStore(s => s.endCell);
  const selections = useSelectionStore(s => s.selections);
  const isDragging = useSelectionStore(s => s.isDragging);
  const hasCopiedData = useSelectionStore(s => s.hasCopiedData);
  const employeeIds = useScheduleStore(s => s.employeeIds);

  // Пересчитываем позиции всех регионов
  const updateOverlayPositions = useCallback(() => {
    if (!tableRef?.current) {
      setRegionStyles([]);
      setEditorPosition(null);
      return;
    }

    const allStyles = [];

    // Добавляем стили для сохранённых выделений
    for (const sel of selections) {
      const style = computeRegionStyle(sel.startCell, sel.endCell, employeeIds, tableRef);
      if (style) allStyles.push(style);
    }

    // Добавляем текущее активное выделение
    if (startCell && endCell) {
      const style = computeRegionStyle(startCell, endCell, employeeIds, tableRef);
      if (style) {
        allStyles.push(style);

        // Позиция редактора - справа от последнего выделения (fixed относительно viewport)
        const tableRect = tableRef.current.getBoundingClientRect();
        const editorLeft = tableRect.left + style.left + style.width + 2;
        const editorTop = tableRect.top + style.top;

        // Проверяем, не выходит ли редактор за правый край экрана
        const viewportWidth = window.innerWidth;
        const editorWidth = 150; // примерная ширина редактора
        const adjustedLeft = editorLeft + editorWidth > viewportWidth
          ? tableRect.left + style.left - editorWidth - 2  // слева от выделения
          : editorLeft;

        // Проверяем, не выходит ли за нижний край
        const viewportHeight = window.innerHeight;
        const editorHeight = 300; // max-height редактора
        const adjustedTop = editorTop + editorHeight > viewportHeight
          ? viewportHeight - editorHeight - 10
          : editorTop;

        setEditorPosition({
          position: 'fixed',
          left: adjustedLeft,
          top: Math.max(10, adjustedTop),  // минимум 10px от верха
          zIndex: 1000
        });
      }
    }

    setRegionStyles(allStyles);

    if (allStyles.length === 0) {
      setEditorPosition(null);
    }
  }, [startCell, endCell, selections, employeeIds, tableRef]);

  // Обновляем позиции при изменении выделения
  useEffect(() => {
    updateOverlayPositions();
  }, [updateOverlayPositions]);

  // Обновляем позиции при скролле
  useEffect(() => {
    if (!tableRef?.current) return;

    const scrollContainer = tableRef.current.closest('.scrollable_container') || tableRef.current.parentElement;
    if (!scrollContainer) return;

    const handleScroll = () => {
      updateOverlayPositions();
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [tableRef, updateOverlayPositions]);

  // Применить значение ко ВСЕМ выделенным ячейкам (включая множественные регионы)
  const handleSelectValue = useCallback((newValue) => {
    const { getAllSelections, setStatus } = useSelectionStore.getState();
    const { saveUndoState, batchUpdateDraftCells } = useAdminStore.getState();
    const { employeeIds } = useScheduleStore.getState();
    const { slotToDate } = useDateStore.getState();

    const allSelections = getAllSelections();
    if (allSelections.length === 0) return;

    // Сохраняем для undo
    saveUndoState();

    const updates = {};
    let count = 0;

    for (const { startCell, endCell } of allSelections) {
      const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
      const endEmpIdx = employeeIds.indexOf(endCell.employeeId);

      const minEmpIdx = Math.min(startEmpIdx, endEmpIdx);
      const maxEmpIdx = Math.max(startEmpIdx, endEmpIdx);
      const minSlot = Math.min(startCell.slotIndex, endCell.slotIndex);
      const maxSlot = Math.max(startCell.slotIndex, endCell.slotIndex);

      for (let empIdx = minEmpIdx; empIdx <= maxEmpIdx; empIdx++) {
        for (let slot = minSlot; slot <= maxSlot; slot++) {
          const empId = employeeIds[empIdx];
          const date = slotToDate[slot];
          if (empId && date) {
            updates[`${empId}-${date}`] = newValue;
            count++;
          }
        }
      }
    }

    batchUpdateDraftCells(updates);
    setStatus(`Установлено "${newValue || '-'}" для ${count} ячеек`);
    setHoveredValue(null);
  }, []);

  // Остановка событий мыши
  const stopPropagation = useCallback((e) => {
    e.stopPropagation();
  }, []);

  // Проверка: выделена только одна ячейка?
  const isSingleCell = startCell && endCell && selections.length === 0 &&
    startCell.employeeId === endCell.employeeId &&
    startCell.slotIndex === endCell.slotIndex;

  // Показывать CellEditor если есть множественное выделение и нет скопированных данных
  const showEditor = editorPosition && !isDragging && !hasCopiedData && !isSingleCell && regionStyles.length > 0;

  if (regionStyles.length === 0) return null;

  return (
    <>
      {/* Overlay для каждого региона выделения */}
      {regionStyles.map((style, idx) => (
        <div key={idx} style={style} />
      ))}

      {/* CellEditor */}
      {showEditor && (
        <div
          style={editorPosition}
          className={styles.cellEditor}
          onMouseDown={stopPropagation}
          onMouseUp={stopPropagation}
          onMouseOver={stopPropagation}
          onClick={stopPropagation}
          onDoubleClick={stopPropagation}
        >
          {statusOptions.map(option => (
            <div
              key={option.value}
              className={`${styles.cellEditorOption} ${hoveredValue === option.value ? styles.cellEditorOptionSelected : ''}`}
              onMouseEnter={() => setHoveredValue(option.value)}
              onMouseLeave={() => setHoveredValue(null)}
              onClick={() => handleSelectValue(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default SelectionOverlay;
