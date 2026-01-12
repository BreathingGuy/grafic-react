import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Хелпер для создания ключа ячейки
const cellKey = (employeeId, slotIndex) => `${employeeId}-${slotIndex}`;

export const useSelectionStore = create(
  devtools((set, get) => ({
    // === STATE ===
    // Текущее активное выделение (которое редактируется)
    startCell: null,       // { employeeId, slotIndex }
    endCell: null,         // { employeeId, slotIndex }
    // Дополнительные выделения (Ctrl+click)
    selections: [],        // [{ startCell, endCell }, ...]
    isDragging: false,
    statusMessage: '',
    hasCopiedData: false,
    // Активная таблица для выделения ('main' | 'offset' | null)
    activeTableId: null,

    // === SELECTION ACTIONS ===

    // Начать выделение (withCtrl = true для добавления к существующему)
    // tableId = 'main' | 'offset' для разделения выделения между таблицами
    startSelection: (employeeId, slotIndex, withCtrl = false, tableId = 'main') => {
      const { startCell, endCell, selections, activeTableId } = get();

      // Если кликнули в другую таблицу - сбрасываем выделение
      if (activeTableId && activeTableId !== tableId) {
        set({
          selections: [],
          startCell: { employeeId, slotIndex },
          endCell: { employeeId, slotIndex },
          isDragging: true,
          activeTableId: tableId
        });
        return;
      }

      if (withCtrl && startCell && endCell) {
        // Ctrl+click: сохраняем текущее выделение и начинаем новое
        set({
          selections: [...selections, { startCell, endCell }],
          startCell: { employeeId, slotIndex },
          endCell: { employeeId, slotIndex },
          isDragging: true,
          activeTableId: tableId
        });
      } else {
        // Обычный клик: сбрасываем все и начинаем новое
        set({
          selections: [],
          startCell: { employeeId, slotIndex },
          endCell: { employeeId, slotIndex },
          isDragging: true,
          activeTableId: tableId
        });
      }
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
      set({ startCell: null, endCell: null, selections: [], isDragging: false, activeTableId: null });
    },

    // === COMPUTED: Получить все регионы выделения ===
    getAllSelections: () => {
      const { startCell, endCell, selections } = get();
      const allSelections = [...selections];
      if (startCell && endCell) {
        allSelections.push({ startCell, endCell });
      }
      return allSelections;
    },

    // === COMPUTED: Получить все выбранные ячейки (для copy/paste) ===
    getSelectedCellKeys: (employeeIds, slotToDate) => {
      const allSelections = get().getAllSelections();
      const keysSet = new Set();

      for (const { startCell, endCell } of allSelections) {
        const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
        const endEmpIdx = employeeIds.indexOf(endCell.employeeId);

        const minEmpIdx = Math.min(startEmpIdx, endEmpIdx);
        const maxEmpIdx = Math.max(startEmpIdx, endEmpIdx);
        const minSlot = Math.min(startCell.slotIndex, endCell.slotIndex);
        const maxSlot = Math.max(startCell.slotIndex, endCell.slotIndex);

        for (let empIdx = minEmpIdx; empIdx <= maxEmpIdx; empIdx++) {
          for (let slot = minSlot; slot <= maxSlot; slot++) {
            if (employeeIds[empIdx] && slotToDate[slot]) {
              keysSet.add(cellKey(employeeIds[empIdx], slot));
            }
          }
        }
      }
      return Array.from(keysSet);
    },

    // Получить количество выделенных ячеек
    getSelectedCount: (employeeIds) => {
      const allSelections = get().getAllSelections();
      let count = 0;

      for (const { startCell, endCell } of allSelections) {
        const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
        const endEmpIdx = employeeIds.indexOf(endCell.employeeId);

        const rows = Math.abs(endEmpIdx - startEmpIdx) + 1;
        const cols = Math.abs(endCell.slotIndex - startCell.slotIndex) + 1;
        count += rows * cols;
      }
      return count;
    },

    // Проверка: выделена только одна ячейка?
    isSingleCellSelected: () => {
      const { startCell, endCell, selections } = get();
      if (selections.length > 0) return false;
      if (!startCell || !endCell) return false;
      return startCell.employeeId === endCell.employeeId &&
             startCell.slotIndex === endCell.slotIndex;
    },

    // === STATUS ===

    setStatus: (message) => {
      set({ statusMessage: message });
      if (message) {
        setTimeout(() => set({ statusMessage: '' }), 2000);
      }
    },

    // === CLIPBOARD ===

    setCopiedData: (hasCopied) => {
      set({ hasCopiedData: hasCopied });
    }

  }), { name: 'SelectionStore' })
);
