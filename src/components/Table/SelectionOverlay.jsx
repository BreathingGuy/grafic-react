import { useEffect, useState, useCallback } from 'react';
import { useSelectionStore } from '../../store/selectionStore';
import { useScheduleStore } from '../../store/scheduleStore';

/**
 * SelectionOverlay - Оверлей для визуализации выделения
 *
 * Вместо того чтобы каждая ячейка подписывалась на selection state,
 * мы рендерим один div поверх таблицы. Это даёт 0 ре-рендеров ячеек.
 */
function SelectionOverlay({ tableRef }) {
  const [overlayStyle, setOverlayStyle] = useState(null);

  // Подписываемся только на границы выделения
  const startCell = useSelectionStore(s => s.startCell);
  const endCell = useSelectionStore(s => s.endCell);
  const employeeIds = useScheduleStore(s => s.employeeIds);

  // Пересчитываем позицию overlay
  const updateOverlayPosition = useCallback(() => {
    if (!startCell || !endCell || !tableRef?.current) {
      setOverlayStyle(null);
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
      return;
    }

    const containerRect = tableRef.current.getBoundingClientRect();
    const topLeftRect = topLeftCell.getBoundingClientRect();
    const bottomRightRect = bottomRightCell.getBoundingClientRect();

    setOverlayStyle({
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

  if (!overlayStyle) return null;

  return <div style={overlayStyle} />;
}

export default SelectionOverlay;
