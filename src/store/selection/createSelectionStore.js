import { create } from 'zustand';

/**
 * Фабрика для создания selection store
 * Используется для main и offset таблиц
 */
export function createSelectionStore() {
  return create((set, get) => ({
        // === STATE ===
        startCell: null,       // { employeeId, slotIndex }
        endCell: null,         // { employeeId, slotIndex }
        selections: [],        // [{ startCell, endCell }, ...]
        isDragging: false,

        // === SELECTION ACTIONS ===

        // Начать выделение (withCtrl = true для добавления к существующему)
        startSelection: (employeeId, slotIndex, withCtrl = false) => {
          const { startCell, endCell, selections } = get();

          if (withCtrl && startCell && endCell) {
            // Ctrl+click: сохраняем текущее выделение и начинаем новое
            set({
              selections: [...selections, { startCell, endCell }],
              startCell: { employeeId, slotIndex },
              endCell: { employeeId, slotIndex },
              isDragging: true
            });
          } else {
            // Обычный клик: сбрасываем все и начинаем новое
            set({
              selections: [],
              startCell: { employeeId, slotIndex },
              endCell: { employeeId, slotIndex },
              isDragging: true
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
          set({ startCell: null, endCell: null, selections: [], isDragging: false });
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

        // Проверка: есть ли выделение?
        hasSelection: () => {
          const { startCell, endCell } = get();
          return startCell !== null && endCell !== null;
        }
  }));
}
