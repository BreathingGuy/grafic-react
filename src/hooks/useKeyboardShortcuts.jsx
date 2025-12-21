import { useEffect, useCallback } from 'react';
import { useSelectionStore } from '../store/selectionStore';
import { useScheduleStore } from '../store/scheduleStore';
import { useDateStore } from '../store/dateStore';

/**
 * useKeyboardShortcuts - Хук для Ctrl+C, Ctrl+V, Ctrl+Z, Escape
 */
export function useKeyboardShortcuts() {
  const selectedCells = useSelectionStore(s => s.selectedCells);
  const saveForUndo = useSelectionStore(s => s.saveForUndo);
  const popUndo = useSelectionStore(s => s.popUndo);
  const setStatus = useSelectionStore(s => s.setStatus);
  const clearSelection = useSelectionStore(s => s.clearSelection);

  const draftSchedule = useScheduleStore(s => s.draftSchedule);
  const batchUpdateDraftCells = useScheduleStore(s => s.batchUpdateDraftCells);
  const restoreDraftSchedule = useScheduleStore(s => s.restoreDraftSchedule);
  const employeeIds = useScheduleStore(s => s.employeeIds);

  const slotToDate = useDateStore(s => s.slotToDate);

  // === КОПИРОВАНИЕ (Ctrl+C) ===
  const copySelected = useCallback(() => {
    if (selectedCells.length === 0) {
      setStatus('Выберите ячейки для копирования');
      return;
    }

    // Границы выделения
    const slots = selectedCells.map(c => c.slotIndex);
    const empIdsInSelection = [...new Set(selectedCells.map(c => c.employeeId))];

    const minSlot = Math.min(...slots);
    const maxSlot = Math.max(...slots);

    // Сортируем по порядку в employeeIds
    const sortedEmpIds = empIdsInSelection.sort((a, b) =>
      employeeIds.indexOf(a) - employeeIds.indexOf(b)
    );

    // Формируем 2D массив
    const data = [];
    sortedEmpIds.forEach(empId => {
      const rowData = [];
      for (let slot = minSlot; slot <= maxSlot; slot++) {
        const date = slotToDate[slot];
        if (date) {
          const key = `${empId}-${date}`;
          rowData.push(draftSchedule[key] || '');
        }
      }
      data.push(rowData);
    });

    // В буфер обмена
    navigator.clipboard.writeText(JSON.stringify(data)).then(() => {
      setStatus(`Скопировано ${data.length}x${data[0]?.length || 0}`);
    }).catch(err => {
      setStatus('Ошибка копирования');
      console.error(err);
    });
  }, [selectedCells, slotToDate, draftSchedule, employeeIds, setStatus]);

  // === ВСТАВКА (Ctrl+V) ===
  const pasteSelected = useCallback(() => {
    if (selectedCells.length === 0) {
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

      // Границы выделения
      const slots = selectedCells.map(c => c.slotIndex);
      const empIdsInSelection = [...new Set(selectedCells.map(c => c.employeeId))];

      const minSlot = Math.min(...slots);
      const maxSlot = Math.max(...slots);

      const sortedEmpIds = empIdsInSelection.sort((a, b) =>
        employeeIds.indexOf(a) - employeeIds.indexOf(b)
      );

      const selectedRowsCount = sortedEmpIds.length;
      const selectedColsCount = maxSlot - minSlot + 1;
      const clipboardRowsCount = data.length;
      const clipboardColsCount = data[0]?.length || 0;

      const updates = {};

      // Логика вставки (как в твоём JS коде)
      if ((selectedColsCount === 1 && clipboardRowsCount === 1) ||
          (selectedColsCount === clipboardColsCount && clipboardRowsCount === 1)) {
        // Размножаем 1 строку на все выделенные
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
        // Размножаем блок (KVADRAT)
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
  }, [selectedCells, slotToDate, draftSchedule, employeeIds, saveForUndo, batchUpdateDraftCells, setStatus]);

  // === ОТМЕНА (Ctrl+Z) ===
  const undo = useCallback(() => {
    const prev = popUndo();
    if (!prev) {
      setStatus('Нечего отменять');
      return;
    }
    restoreDraftSchedule(prev);
    setStatus('Отменено');
  }, [popUndo, restoreDraftSchedule, setStatus]);

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
        clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [copySelected, pasteSelected, undo, clearSelection]);

  return { copySelected, pasteSelected, undo, clearSelection };
}

export default useKeyboardShortcuts;
