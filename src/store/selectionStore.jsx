import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Хелпер для создания ключа ячейки
const cellKey = (employeeId, slotIndex) => `${employeeId}-${slotIndex}`;

export const useSelectionStore = create(
  devtools((set, get) => ({
    // === STATE ===
    // Храним только границы выделения - не отдельные ячейки
    startCell: null,       // { employeeId, slotIndex }
    endCell: null,         // { employeeId, slotIndex }
    isDragging: false,
    undoStack: [],
    statusMessage: '',

    // === SELECTION ACTIONS ===

    startSelection: (employeeId, slotIndex) => {
      set({
        startCell: { employeeId, slotIndex },
        endCell: { employeeId, slotIndex },
        isDragging: true
      });
    },

    updateSelection: (endEmployeeId, endSlotIndex) => {
      const { isDragging } = get();
      if (!isDragging) return;

      set({ endCell: { employeeId: endEmployeeId, slotIndex: endSlotIndex } });
    },

    endSelection: () => {
      set({ isDragging: false });
    },

    clearSelection: () => {
      set({ startCell: null, endCell: null, isDragging: false });
    },

    // === COMPUTED: Получить границы выделения ===
    getSelectionBounds: (employeeIds) => {
      const { startCell, endCell } = get();
      if (!startCell || !endCell) return null;

      const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
      const endEmpIdx = employeeIds.indexOf(endCell.employeeId);

      return {
        minEmpIdx: Math.min(startEmpIdx, endEmpIdx),
        maxEmpIdx: Math.max(startEmpIdx, endEmpIdx),
        minSlot: Math.min(startCell.slotIndex, endCell.slotIndex),
        maxSlot: Math.max(startCell.slotIndex, endCell.slotIndex)
      };
    },

    // === COMPUTED: Получить все выбранные ячейки (для copy/paste) ===
    getSelectedCellKeys: (employeeIds, visibleSlots) => {
      const { startCell, endCell } = get();
      if (!startCell || !endCell) return [];

      const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
      const endEmpIdx = employeeIds.indexOf(endCell.employeeId);

      const minEmpIdx = Math.min(startEmpIdx, endEmpIdx);
      const maxEmpIdx = Math.max(startEmpIdx, endEmpIdx);
      const minSlot = Math.min(startCell.slotIndex, endCell.slotIndex);
      const maxSlot = Math.max(startCell.slotIndex, endCell.slotIndex);

      const keys = [];
      for (let empIdx = minEmpIdx; empIdx <= maxEmpIdx; empIdx++) {
        for (let slot = minSlot; slot <= maxSlot; slot++) {
          if (slot < visibleSlots.length && employeeIds[empIdx]) {
            keys.push(cellKey(employeeIds[empIdx], slot));
          }
        }
      }
      return keys;
    },

    // Проверка выделена ли ячейка (для редактирования)
    isCellSelected: (employeeId, slotIndex, employeeIds) => {
      const { startCell, endCell } = get();
      if (!startCell || !endCell) return false;

      const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
      const endEmpIdx = employeeIds.indexOf(endCell.employeeId);
      const cellEmpIdx = employeeIds.indexOf(employeeId);

      const minEmpIdx = Math.min(startEmpIdx, endEmpIdx);
      const maxEmpIdx = Math.max(startEmpIdx, endEmpIdx);
      const minSlot = Math.min(startCell.slotIndex, endCell.slotIndex);
      const maxSlot = Math.max(startCell.slotIndex, endCell.slotIndex);

      return cellEmpIdx >= minEmpIdx && cellEmpIdx <= maxEmpIdx &&
             slotIndex >= minSlot && slotIndex <= maxSlot;
    },

    // Получить количество выделенных ячеек
    getSelectedCount: (employeeIds, visibleSlots) => {
      const { startCell, endCell } = get();
      if (!startCell || !endCell) return 0;

      const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
      const endEmpIdx = employeeIds.indexOf(endCell.employeeId);

      const rows = Math.abs(endEmpIdx - startEmpIdx) + 1;
      const cols = Math.abs(endCell.slotIndex - startCell.slotIndex) + 1;

      return rows * cols;
    },

    // === UNDO ===

    saveForUndo: (draftSchedule) => {
      set(state => ({
        undoStack: [...state.undoStack, { ...draftSchedule }]
      }));
    },

    popUndo: () => {
      const { undoStack } = get();
      if (undoStack.length === 0) return null;

      const lastState = undoStack[undoStack.length - 1];
      set(state => ({
        undoStack: state.undoStack.slice(0, -1)
      }));
      return lastState;
    },

    clearUndoStack: () => {
      set({ undoStack: [] });
    },

    // === STATUS ===

    setStatus: (message) => {
      set({ statusMessage: message });
      if (message) {
        setTimeout(() => set({ statusMessage: '' }), 2000);
      }
    }

  }), { name: 'SelectionStore' })
);
