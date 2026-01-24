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
    console.log('📋 copySelected: начало');
    const { getAllSelections, setStatus, setCopiedData } = useSelectionStore.getState();
    const adminState = useAdminStore.getState();
    const { draftSchedule, employeeIds } = adminState;
    const dateAdminState = useDateAdminStore.getState();
    const { slotToDate, offsetSlotToDate } = dateAdminState;

    console.log('📋 copySelected: состояние', {
      employeeIdsLength: employeeIds?.length,
      draftScheduleKeys: Object.keys(draftSchedule).length,
      isAdminMode: adminState.isAdminMode,
      editingDepartmentId: adminState.editingDepartmentId,
      editingYear: adminState.editingYear
    });

    // ВАЖНО: Проверяем, что данные загружены
    if (!employeeIds || employeeIds.length === 0) {
      setStatus('Данные не загружены');
      console.warn('copySelected: employeeIds пустой', { employeeIds, adminState });
      return;
    }

    const allSelections = getAllSelections();
    if (allSelections.length === 0) {
      setStatus('Выберите ячейки для копирования');
      return;
    }

    // Копируем только первый регион
    const { startCell, endCell } = allSelections[0];

    // Определяем правильный slotToDate в зависимости от tableId
    const tableId = startCell.tableId || 'main';
    const currentSlotToDate = tableId === 'offset' ? offsetSlotToDate : slotToDate;

    console.log('📋 copySelected: выделение', {
      startCell: { ...startCell },
      endCell: { ...endCell },
      tableId,
      startSlot: startCell.slotIndex,
      endSlot: endCell.slotIndex
    });

    const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
    const endEmpIdx = employeeIds.indexOf(endCell.employeeId);

    const minEmpIdx = Math.min(startEmpIdx, endEmpIdx);
    const maxEmpIdx = Math.max(startEmpIdx, endEmpIdx);
    const minSlot = Math.min(startCell.slotIndex, endCell.slotIndex);
    const maxSlot = Math.max(startCell.slotIndex, endCell.slotIndex);

    console.log('📋 copySelected: диапазон', {
      minSlot,
      maxSlot,
      minSlotDate: currentSlotToDate[minSlot],
      maxSlotDate: currentSlotToDate[maxSlot],
      usingTable: tableId
    });

    const data = [];
    for (let empIdx = minEmpIdx; empIdx <= maxEmpIdx; empIdx++) {
      const rowData = [];
      for (let slot = minSlot; slot <= maxSlot; slot++) {
        const date = currentSlotToDate[slot];
        const empId = employeeIds[empIdx];
        if (date && empId) {
          const key = `${empId}-${date}`;
          rowData.push(draftSchedule[key] || '');
        }
      }
      data.push(rowData);
    }

    console.log('📋 copySelected: данные скопированы', { rows: data.length, cols: data[0]?.length });

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
      console.error('copySelected: ошибка', err);
    });
  }, []); // Пустые зависимости - функция всегда получает актуальные данные через getState()

  // === ВСТАВКА (Ctrl+V) ===
  const pasteSelected = useCallback(() => {
    console.log('📋 pasteSelected: начало');
    const { getAllSelections, setStatus } = useSelectionStore.getState();
    const adminState = useAdminStore.getState();
    const { saveUndoState, batchUpdateDraftCells, employeeIds, draftSchedule } = adminState;
    const dateAdminState = useDateAdminStore.getState();
    const { slotToDate, offsetSlotToDate } = dateAdminState;

    console.log('📋 pasteSelected: состояние', {
      employeeIdsLength: employeeIds?.length,
      draftScheduleKeys: Object.keys(draftSchedule).length,
      isAdminMode: adminState.isAdminMode,
      editingDepartmentId: adminState.editingDepartmentId,
      editingYear: adminState.editingYear,
      hasUnsavedChanges: adminState.hasUnsavedChanges
    });

    // ВАЖНО: Проверяем, что данные загружены
    if (!employeeIds || employeeIds.length === 0) {
      setStatus('Данные не загружены');
      console.warn('pasteSelected: employeeIds пустой', { employeeIds, adminState });
      return;
    }

    const allSelections = getAllSelections();
    if (allSelections.length === 0) {
      setStatus('Выберите ячейки для вставки');
      console.log('📋 pasteSelected: нет выделения');
      return;
    }

    console.log('📋 pasteSelected: выделений:', allSelections.length);

    navigator.clipboard.readText().then(text => {
      console.log('📋 pasteSelected: прочитан буфер обмена');
      let data;
      try {
        data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error();
        console.log('📋 pasteSelected: данные распарсены', { rows: data.length, cols: data[0]?.length });
      } catch (err) {
        setStatus('Неверный формат данных');
        console.error('📋 pasteSelected: ошибка парсинга', err);
        return;
      }

      // Сохраняем для undo
      console.log('📋 pasteSelected: сохраняем undo state');
      saveUndoState();

      const updates = {};

      // Вставляем в каждый выделенный регион
      for (const { startCell, endCell } of allSelections) {
        // Определяем правильный slotToDate в зависимости от tableId
        const tableId = startCell.tableId || 'main';
        const currentSlotToDate = tableId === 'offset' ? offsetSlotToDate : slotToDate;

        console.log('📋 pasteSelected: обработка региона', {
          startCell: { ...startCell },
          endCell: { ...endCell },
          tableId,
          startSlot: startCell.slotIndex,
          endSlot: endCell.slotIndex
        });

        const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
        const endEmpIdx = employeeIds.indexOf(endCell.employeeId);

        const minEmpIdx = Math.min(startEmpIdx, endEmpIdx);
        const maxEmpIdx = Math.max(startEmpIdx, endEmpIdx);
        const minSlot = Math.min(startCell.slotIndex, endCell.slotIndex);
        const maxSlot = Math.max(startCell.slotIndex, endCell.slotIndex);

        console.log('📋 pasteSelected: диапазон вставки', {
          minSlot,
          maxSlot,
          minSlotDate: currentSlotToDate[minSlot],
          maxSlotDate: currentSlotToDate[maxSlot],
          usingTable: tableId
        });

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
                  const date = currentSlotToDate[targetSlot];
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
                  const date = currentSlotToDate[targetSlot];
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
                    const date = currentSlotToDate[targetSlot];
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
                const date = currentSlotToDate[targetSlot];
                if (empId && date) {
                  updates[`${empId}-${date}`] = value;
                }
              }
            });
          });
        }
      }

      console.log('📋 pasteSelected: вызываем batchUpdateDraftCells', {
        updatesCount: Object.keys(updates).length,
        sampleUpdates: Object.entries(updates).slice(0, 3)
      });

      batchUpdateDraftCells(updates);

      console.log('📋 pasteSelected: завершено', {
        rows: data.length,
        cols: data[0]?.length || 0
      });

      setStatus(`Вставлено ${data.length}x${data[0]?.length || 0}`);
    }).catch(err => {
      setStatus('Ошибка вставки');
      console.error('📋 pasteSelected: ошибка', err);
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
      // Проверяем админ режим
      const { isAdminMode } = useAdminStore.getState();

      if (!isAdminMode) {
        return; // Горячие клавиши работают только в админ режиме
      }

      if (e.ctrlKey && e.key === 'c') {
        console.log('🔑 Ctrl+C pressed');
        e.preventDefault();
        copySelected();
      } else if (e.ctrlKey && e.key === 'v') {
        console.log('🔑 Ctrl+V pressed');
        e.preventDefault();
        pasteSelected();
      } else if (e.ctrlKey && e.key === 'z') {
        console.log('🔑 Ctrl+Z pressed');
        e.preventDefault();
        undo();
      } else if (e.key === 'Escape') {
        console.log('🔑 Escape pressed');
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