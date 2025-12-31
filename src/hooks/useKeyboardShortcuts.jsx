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
    const { slotToDate, visibleSlots } = useDateStore.getState();

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

      // Сортированные empId в пределах выделения
      const sortedEmpIds = [];
      for (let i = minEmpIdx; i <= maxEmpIdx; i++) {
        sortedEmpIds.push(employeeIds[i]);
      }

      const selectedRowsCount = sortedEmpIds.length;
      const selectedColsCount = maxSlot - minSlot + 1;
      const clipboardRowsCount = data.length;
      const clipboardColsCount = data[0]?.length || 0;

      const updates = {};

      // Логика вставки
      if ((selectedColsCount === 1 && clipboardRowsCount === 1) ||
          (selectedColsCount === clipboardColsCount && clipboardRowsCount === 1)) {
        // Размножаем 1 строку
        for (let i = 0; i < selectedRowsCount; i++) {
          data[0].forEach((value, cIndex) => {
            const targetSlot = minSlot + cIndex;
            const date = slotToDate[targetSlot];
            if (date && sortedEmpIds[i]) {
              updates[`${sortedEmpIds[i]}-${date}`] = value;
            }
          });
        }
      } else if (selectedRowsCount % clipboardRowsCount === 0 &&
                 selectedColsCount % clipboardColsCount === 0) {
        // Размножаем блок
        for (let j = 0; j < selectedColsCount; j += clipboardColsCount) {
          for (let i = 0; i < selectedRowsCount; i += clipboardRowsCount) {
            data.forEach((row, rIdx) => {
              row.forEach((value, cIdx) => {
                const empIdx = i + rIdx;
                const targetSlot = minSlot + j + cIdx;
                const date = slotToDate[targetSlot];
                if (date && sortedEmpIds[empIdx]) {
                  updates[`${sortedEmpIds[empIdx]}-${date}`] = value;
                }
              });
            });
          }
        }
      } else {
        // Обычная вставка
        data.forEach((row, rIdx) => {
          row.forEach((value, cIdx) => {
            const targetSlot = minSlot + cIdx;
            const date = slotToDate[targetSlot];
            if (date && sortedEmpIds[rIdx]) {
              updates[`${sortedEmpIds[rIdx]}-${date}`] = value;
            }
          });
        });
      }

      batchUpdateDraftCells(updates);
      setStatus(`Вставлено ${clipboardRowsCount}x${clipboardColsCount}`);
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
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [copySelected, pasteSelected, undo]);

  return { copySelected, pasteSelected, undo };
}

export default useKeyboardShortcuts;
