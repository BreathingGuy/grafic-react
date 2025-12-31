import { useEffect, useState, useCallback } from 'react';
import { useSelectionStore } from '../../store/selectionStore';
import { useScheduleStore } from '../../store/scheduleStore';
import { useDateStore } from '../../store/dateStore';
import styles from './Table.module.css';

/**
 * SelectionOverlay - Оверлей для визуализации выделения + CellEditor
 *
 * Вместо того чтобы каждая ячейка подписывалась на selection state,
 * мы рендерим один div поверх таблицы. Это даёт 0 ре-рендеров ячеек.
 * Также показываем CellEditor для группового редактирования.
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

function SelectionOverlay({ tableRef }) {
  const [overlayStyle, setOverlayStyle] = useState(null);
  const [editorPosition, setEditorPosition] = useState(null);
  const [hoveredValue, setHoveredValue] = useState(null);

  // Подписываемся только на границы выделения
  const startCell = useSelectionStore(s => s.startCell);
  const endCell = useSelectionStore(s => s.endCell);
  const isDragging = useSelectionStore(s => s.isDragging);
  const employeeIds = useScheduleStore(s => s.employeeIds);

  // Пересчитываем позицию overlay
  const updateOverlayPosition = useCallback(() => {
    if (!startCell || !endCell || !tableRef?.current) {
      setOverlayStyle(null);
      setEditorPosition(null);
      return;
    }

    // Находим индексы границ
    const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
    const endEmpIdx = employeeIds.indexOf(endCell.employeeId);

    const minEmpIdx = Math.min(startEmpIdx, endEmpIdx);
    const maxEmpIdx = Math.max(startEmpIdx, endEmpIdx);
    const minSlot = Math.min(startCell.slotIndex, endCell.slotIndex);
    const maxSlot = Math.max(startCell.slotIndex, endCell.slotIndex);

    // Находим ячейки по data-атрибутам
    const topLeftCell = tableRef.current.querySelector(
      `[data-emp-idx="${minEmpIdx}"][data-slot="${minSlot}"]`
    );
    const bottomRightCell = tableRef.current.querySelector(
      `[data-emp-idx="${maxEmpIdx}"][data-slot="${maxSlot}"]`
    );

    if (!topLeftCell || !bottomRightCell) {
      setOverlayStyle(null);
      setEditorPosition(null);
      return;
    }

    const containerRect = tableRef.current.getBoundingClientRect();
    const topLeftRect = topLeftCell.getBoundingClientRect();
    const bottomRightRect = bottomRightCell.getBoundingClientRect();

    const left = topLeftRect.left - containerRect.left;
    const top = topLeftRect.top - containerRect.top;
    const width = bottomRightRect.right - topLeftRect.left;
    const height = bottomRightRect.bottom - topLeftRect.top;

    setOverlayStyle({
      position: 'absolute',
      left,
      top,
      width,
      height,
      border: '2px solid #1976d2',
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      pointerEvents: 'none',
      zIndex: 10,
      boxSizing: 'border-box'
    });

    // Позиция редактора - справа от выделения
    setEditorPosition({
      position: 'absolute',
      left: left + width + 2,
      top: top,
      zIndex: 100
    });
  }, [startCell, endCell, employeeIds, tableRef]);

  // Обновляем позицию при изменении выделения
  useEffect(() => {
    updateOverlayPosition();
  }, [updateOverlayPosition]);

  // Обновляем позицию при скролле
  useEffect(() => {
    if (!tableRef?.current) return;

    const scrollContainer = tableRef.current.closest('.scrollable_container') || tableRef.current.parentElement;
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (startCell && endCell) {
        updateOverlayPosition();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [tableRef, startCell, endCell, updateOverlayPosition]);

  // Применить значение ко всем выделенным ячейкам
  const handleSelectValue = useCallback((newValue) => {
    const { startCell, endCell, setStatus } = useSelectionStore.getState();
    const { batchUpdateDraftCells, draftSchedule, employeeIds } = useScheduleStore.getState();
    const { slotToDate } = useDateStore.getState();
    const { saveForUndo } = useSelectionStore.getState();

    if (!startCell || !endCell) return;

    // Сохраняем для undo
    saveForUndo(draftSchedule);

    const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
    const endEmpIdx = employeeIds.indexOf(endCell.employeeId);

    const minEmpIdx = Math.min(startEmpIdx, endEmpIdx);
    const maxEmpIdx = Math.max(startEmpIdx, endEmpIdx);
    const minSlot = Math.min(startCell.slotIndex, endCell.slotIndex);
    const maxSlot = Math.max(startCell.slotIndex, endCell.slotIndex);

    const updates = {};
    let count = 0;

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

    batchUpdateDraftCells(updates);
    setStatus(`Установлено "${newValue || '-'}" для ${count} ячеек`);
    setHoveredValue(null);
  }, []);

  // Остановка событий мыши
  const stopPropagation = useCallback((e) => {
    e.stopPropagation();
  }, []);

  if (!overlayStyle) return null;

  return (
    <>
      {/* Overlay выделения */}
      <div style={overlayStyle} />

      {/* CellEditor - показываем только когда не dragging */}
      {editorPosition && !isDragging && (
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
