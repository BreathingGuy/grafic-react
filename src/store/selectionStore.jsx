import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useSelectionStore = create(
  devtools((set, get) => ({
    // === STATE ===
    selectedCells: [],        // [{ employeeId, slotIndex }, ...]
    startCell: null,          // Начальная ячейка для drag-выделения
    isDragging: false,        // Флаг перетаскивания
    undoStack: [],            // Стек для Ctrl+Z
    statusMessage: '',        // Сообщение в статус-баре

    // === ACTIONS ===

    // Начать выделение (mousedown)
    startSelection: (employeeId, slotIndex) => {
      set({
        startCell: { employeeId, slotIndex },
        selectedCells: [{ employeeId, slotIndex }],
        isDragging: true
      });
    },

    // Обновить выделение при движении мыши
    updateSelection: (endEmployeeId, endSlotIndex, employeeIds, visibleSlots) => {
      const { startCell, isDragging } = get();
      if (!isDragging || !startCell) return;

      const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
      const endEmpIdx = employeeIds.indexOf(endEmployeeId);
      const startSlot = startCell.slotIndex;
      const endSlot = endSlotIndex;

      const minEmpIdx = Math.min(startEmpIdx, endEmpIdx);
      const maxEmpIdx = Math.max(startEmpIdx, endEmpIdx);
      const minSlot = Math.min(startSlot, endSlot);
      const maxSlot = Math.max(startSlot, endSlot);

      const newSelection = [];
      for (let empIdx = minEmpIdx; empIdx <= maxEmpIdx; empIdx++) {
        for (let slot = minSlot; slot <= maxSlot; slot++) {
          if (visibleSlots.includes(slot)) {
            newSelection.push({
              employeeId: employeeIds[empIdx],
              slotIndex: slot
            });
          }
        }
      }

      set({ selectedCells: newSelection });
    },

    // Завершить выделение (mouseup)
    endSelection: () => {
      set({ isDragging: false, startCell: null });
    },

    // Очистить выделение
    clearSelection: () => {
      set({ selectedCells: [], startCell: null, isDragging: false });
    },

    // Сохранить состояние для Undo
    saveForUndo: (draftSchedule) => {
      set(state => ({
        undoStack: [...state.undoStack, { ...draftSchedule }]
      }));
    },

    // Получить последнее состояние из undo стека
    popUndo: () => {
      const { undoStack } = get();
      if (undoStack.length === 0) return null;

      const lastState = undoStack[undoStack.length - 1];
      set(state => ({
        undoStack: state.undoStack.slice(0, -1)
      }));
      return lastState;
    },

    // Показать сообщение статуса
    setStatus: (message) => {
      set({ statusMessage: message });
      if (message) {
        setTimeout(() => set({ statusMessage: '' }), 2000);
      }
    },

    // Очистить undo стек
    clearUndoStack: () => {
      set({ undoStack: [] });
    }

  }), { name: 'SelectionStore' })
);
