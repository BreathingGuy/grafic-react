import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Хелпер для создания ключа ячейки
const cellKey = (employeeId, slotIndex) => `${employeeId}-${slotIndex}`;

export const useSelectionStore = create(
  devtools((set, get) => ({
    // === STATE ===
    selectedCells: new Set(),   // Set<"employeeId-slotIndex">
    startCell: null,            // { employeeId, slotIndex }
    isDragging: false,
    undoStack: [],
    statusMessage: '',

    // === SELECTION ACTIONS ===

    startSelection: (employeeId, slotIndex) => {
      const newSet = new Set([cellKey(employeeId, slotIndex)]);
      set({
        startCell: { employeeId, slotIndex },
        selectedCells: newSet,
        isDragging: true
      });
    },

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

      const newSet = new Set();
      for (let empIdx = minEmpIdx; empIdx <= maxEmpIdx; empIdx++) {
        for (let slot = minSlot; slot <= maxSlot; slot++) {
          if (slot < visibleSlots.length) {
            newSet.add(cellKey(employeeIds[empIdx], slot));
          }
        }
      }

      set({ selectedCells: newSet });
    },

    endSelection: () => {
      set({ isDragging: false, startCell: null });
    },

    clearSelection: () => {
      set({ selectedCells: new Set(), startCell: null, isDragging: false });
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
    },

    // === HELPERS (для копирования) ===

    // Получить границы выделения
    getSelectionBounds: () => {
      const { selectedCells } = get();
      if (selectedCells.size === 0) return null;

      let minSlot = Infinity, maxSlot = -Infinity;
      const empIds = new Set();

      selectedCells.forEach(key => {
        const [empId, slot] = key.split('-');
        empIds.add(empId);
        const slotNum = parseInt(slot, 10);
        minSlot = Math.min(minSlot, slotNum);
        maxSlot = Math.max(maxSlot, slotNum);
      });

      return { empIds: [...empIds], minSlot, maxSlot };
    }

  }), { name: 'SelectionStore' })
);
