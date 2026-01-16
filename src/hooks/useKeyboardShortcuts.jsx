import { useEffect, useCallback } from 'react';
import { useSelectionStore } from '../store/selectionStore';
import { useAdminStore } from '../store/adminStore';
import { useDateAdminStore } from '../store/dateAdminStore';

/**
 * useKeyboardShortcuts - Хук для Ctrl+C, Ctrl+V, Ctrl+Z, Escape
 * Поддерживает множественное выделение (Ctrl+click)
 */
export function useKeyboardShortcuts() {
  // === КОПИРОВАНИЕ (Ctrl+C) ===
  // Копируется только первый (активный) регион выделения
  const copySelected = useCallback(() => {
    const { getAllSelections, setStatus, setCopiedData } = useSelectionStore.getState();
    const { draftSchedule, employeeIds } = useAdminStore.getState();
    const { slotToDate } = useDateAdminStore.getState();

    const allSelections = getAllSelections();
    if (allSelections.length === 0) {
      setStatus('Выберите ячейки для копирования');
      return;
    }

    // Копируем только первый регион
    const { startCell, endCell } = allSelections[0];

    const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
    const endEmpIdx = employeeIds.indexOf(endCell.employeeId);

    const minEmpIdx = Math.min(startEmpIdx, endEmpIdx);
    const maxEmpIdx = Math.max(startEmpIdx, endEmpIdx);
    const minSlot = Math.min(startCell.slotIndex, endCell.slotIndex);
    const maxSlot = Math.max(startCell.slotIndex, endCell.slotIndex);

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
      setCopiedData(true);
      const rows = data.length;
      const cols = data[0]?.length || 0;
      if (allSelections.length > 1) {
        setStatus(`Скопировано ${rows}x${cols} (только первый регион)`);
      } else {
        setStatus(`Скопировано ${rows}x${cols}`);
      }
    }).catch(err => {
      setStatus('Ошибка копирования');
      console.error(err);
    });
  }, []);

  // === ВСТАВКА (Ctrl+V) ===
  const pasteSelected = useCallback(() => {
    const { getAllSelections, setStatus } = useSelectionStore.getState();
    const { saveUndoState, batchUpdateDraftCells, employeeIds } = useAdminStore.getState();
    const { slotToDate } = useDateAdminStore.getState();

    const allSelections = getAllSelections();
    if (allSelections.length === 0) {
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
      saveUndoState();

      const updates = {};

      // Вставляем в каждый выделенный регион
      for (const { startCell, endCell } of allSelections) {
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

        // Логика вставки как в оригинале
        if ((selectedColsCount === 1 && clipboardRowsCount === 1) ||
            (selectedColsCount === clipboardColsCount && clipboardRowsCount === 1)) {
          // 1 ROW COPYING vertical - размножаем одну строку вертикально
          for (let i = 0; i < selectedRowsCount; i++) {
            data.forEach((row, rIndex) => {
              row.forEach((value, cIndex) => {
                const targetEmpIdx = minEmpIdx + rIndex + i;
                const targetSlot = minSlot + cIndex;
                if (targetEmpIdx < employeeIds.length) {
                  const empId = employeeIds[targetEmpIdx];
                  const date = slotToDate[targetSlot];
                  if (empId && date) {
                    updates[`${empId}-${date}`] = value;
                  }
                }
              });
            });
          }
        } else if (selectedRowsCount === 1 && clipboardColsCount === 1) {
          // 1 ROW COPYING horizontal - размножаем один столбец горизонтально
          for (let i = 0; i < selectedColsCount; i++) {
            data.forEach((row, rIndex) => {
              row.forEach((value, cIndex) => {
                const targetEmpIdx = minEmpIdx + rIndex;
                const targetSlot = minSlot + cIndex + i;
                if (targetEmpIdx < employeeIds.length) {
                  const empId = employeeIds[targetEmpIdx];
                  const date = slotToDate[targetSlot];
                  if (empId && date) {
                    updates[`${empId}-${date}`] = value;
                  }
                }
              });
            });
          }
        } else if (selectedRowsCount % clipboardRowsCount === 0 &&
                   selectedColsCount % clipboardColsCount === 0) {
          // COPYING KVADRAT - тайлинг блока
          for (let j = 0; j < selectedColsCount; j += clipboardColsCount) {
            for (let i = 0; i < selectedRowsCount; i += clipboardRowsCount) {
              data.forEach((row, rIndex) => {
                row.forEach((value, cIndex) => {
                  const targetEmpIdx = minEmpIdx + rIndex + i;
                  const targetSlot = minSlot + cIndex + j;
                  if (targetEmpIdx < employeeIds.length) {
                    const empId = employeeIds[targetEmpIdx];
                    const date = slotToDate[targetSlot];
                    if (empId && date) {
                      updates[`${empId}-${date}`] = value;
                    }
                  }
                });
              });
            }
          }
        } else {
          // BASIC COPYING - обычная вставка
          data.forEach((row, rIndex) => {
            row.forEach((value, cIndex) => {
              const targetEmpIdx = minEmpIdx + rIndex;
              const targetSlot = minSlot + cIndex;
              if (targetEmpIdx < employeeIds.length) {
                const empId = employeeIds[targetEmpIdx];
                const date = slotToDate[targetSlot];
                if (empId && date) {
                  updates[`${empId}-${date}`] = value;
                }
              }
            });
          });
        }
      }

      batchUpdateDraftCells(updates);
      setStatus(`Вставлено ${data.length}x${data[0]?.length || 0}`);
    }).catch(err => {
      setStatus('Ошибка вставки');
      console.error(err);
    });
  }, []);

  // === ОТМЕНА (Ctrl+Z) ===
  const undo = useCallback(() => {
    const { setStatus } = useSelectionStore.getState();
    const { undo: adminUndo } = useAdminStore.getState();

    const success = adminUndo();
    if (!success) {
      setStatus('Нечего отменять');
      return;
    }
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