import { useEffect, useCallback } from 'react';
import { useSelectionStore } from '../store/selectionStore';
import { useScheduleStore } from '../store/scheduleStore';
import { useDateStore } from '../store/dateStore';

/**
 * useKeyboardShortcuts - Хук для Ctrl+C, Ctrl+V, Ctrl+Z, Escape
 */
export function useKeyboardShortcuts() {
  // === КОПИРОВАНИЕ (Ctrl+C) ===
  const copySelected = useCallback(() => {
    const { startCell, endCell, setStatus } = useSelectionStore.getState();
    const { draftSchedule, employeeIds } = useScheduleStore.getState();
    const { slotToDate } = useDateStore.getState();

    if (!startCell || !endCell) {
      setStatus('Выберите ячейки для копирования');
      return;
    }

    // Вычисляем границы
    const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
    const endEmpIdx = employeeIds.indexOf(endCell.employeeId);

    const minEmpIdx = Math.min(startEmpIdx, endEmpIdx);
    const maxEmpIdx = Math.max(startEmpIdx, endEmpIdx);
    const minSlot = Math.min(startCell.slotIndex, endCell.slotIndex);
    const maxSlot = Math.max(startCell.slotIndex, endCell.slotIndex);

    // Формируем 2D массив
    const data = [];
    for (let empIdx = minEmpIdx; empIdx <= maxEmpIdx; empIdx++) {
      const rowData = [];
      for (let slot = minSlot; slot <= maxSlot; slot++) {
        const date = slotToDate[slot];
        const empId = employeeIds[empIdx];
        if (date && empId) {
          const key = `${empId}-${date}`;
          rowData.push(draftSchedule[key] || '');
        }
      }
      data.push(rowData);
    }

    navigator.clipboard.writeText(JSON.stringify(data)).then(() => {
      useSelectionStore.getState().setCopiedData(true);
      setStatus(`Скопировано ${data.length}x${data[0]?.length || 0}`);
    }).catch(err => {
      setStatus('Ошибка копирования');
      console.error(err);
    });
  }, []);

  // === ВСТАВКА (Ctrl+V) ===
  const pasteSelected = useCallback(() => {
    const { startCell, endCell, setStatus, saveForUndo } = useSelectionStore.getState();
    const { draftSchedule, batchUpdateDraftCells, employeeIds } = useScheduleStore.getState();
    const { slotToDate } = useDateStore.getState();

    if (!startCell || !endCell) {
      setStatus('Выберите ячейки для вставки');
      return;
    }

    navigator.clipboard.readText().then(text => {
      let data;
      try {
        data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error();
      } catch {
        setStatus('Неверный формат данных');
        return;
      }

      // Сохраняем для undo
      saveForUndo(draftSchedule);

      // Вычисляем границы выделения
      const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
      const endEmpIdx = employeeIds.indexOf(endCell.employeeId);

      const minEmpIdx = Math.min(startEmpIdx, endEmpIdx);
      const maxEmpIdx = Math.max(startEmpIdx, endEmpIdx);
      const minSlot = Math.min(startCell.slotIndex, endCell.slotIndex);
      const maxSlot = Math.max(startCell.slotIndex, endCell.slotIndex);

      const selectedRowsCount = maxEmpIdx - minEmpIdx + 1;
      const selectedColsCount = maxSlot - minSlot + 1;
      const clipboardRowsCount = data.length;
      const clipboardColsCount = data[0]?.length || 0;

      const updates = {};

      // Определяем реальные размеры для вставки
      // Если буфер больше выделения - вставляем весь буфер
      // Если выделение больше и кратно буферу - размножаем
      const pasteRows = Math.max(selectedRowsCount, clipboardRowsCount);
      const pasteCols = Math.max(selectedColsCount, clipboardColsCount);

      // Проверяем можно ли размножить
      const canTileRows = selectedRowsCount > clipboardRowsCount && selectedRowsCount % clipboardRowsCount === 0;
      const canTileCols = selectedColsCount > clipboardColsCount && selectedColsCount % clipboardColsCount === 0;

      const finalRows = canTileRows ? selectedRowsCount : pasteRows;
      const finalCols = canTileCols ? selectedColsCount : pasteCols;

      for (let i = 0; i < finalRows; i++) {
        for (let j = 0; j < finalCols; j++) {
          // Индексы в буфере (с повторением для тайлинга)
          const srcRow = i % clipboardRowsCount;
          const srcCol = j % clipboardColsCount;

          const value = data[srcRow]?.[srcCol];
          if (value === undefined) continue;

          const targetEmpIdx = minEmpIdx + i;
          const targetSlot = minSlot + j;

          // Проверяем границы
          if (targetEmpIdx >= employeeIds.length) continue;

          const empId = employeeIds[targetEmpIdx];
          const date = slotToDate[targetSlot];

          if (empId && date) {
            updates[`${empId}-${date}`] = value;
          }
        }
      }

      batchUpdateDraftCells(updates);
      const actualRows = Object.keys(updates).length > 0 ? finalRows : 0;
      setStatus(`Вставлено ${actualRows}x${finalCols}`);
    }).catch(err => {
      setStatus('Ошибка вставки');
      console.error(err);
    });
  }, []);

  // === ОТМЕНА (Ctrl+Z) ===
  const undo = useCallback(() => {
    const { popUndo, setStatus } = useSelectionStore.getState();
    const { restoreDraftSchedule } = useScheduleStore.getState();

    const prev = popUndo();
    if (!prev) {
      setStatus('Нечего отменять');
      return;
    }
    restoreDraftSchedule(prev);
    setStatus('Отменено');
  }, []);

  // === ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ===
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        copySelected();
      } else if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        pasteSelected();
      } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.key === 'Escape') {
        useSelectionStore.getState().clearSelection();
        useSelectionStore.getState().setCopiedData(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [copySelected, pasteSelected, undo]);

  return { copySelected, pasteSelected, undo };
}

export default useKeyboardShortcuts;
