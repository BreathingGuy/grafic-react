import { create } from 'zustand';
import { useMainSelectionStore } from './mainSelectionStore';
import { useOffsetSelectionStore } from './offsetSelectionStore';

/**
 * ClipboardStore - общий стор для copy/paste между таблицами
 *
 * Хранит скопированные данные и отслеживает активную таблицу
 */
export const useClipboardStore = create((set, get) => ({
      // === STATE ===
      hasCopiedData: false,
      statusMessage: '',
      // Какая таблица была активна при последнем действии
      activeTableId: null,  // 'main' | 'offset' | null

      // === ACTIONS ===

      // Установить активную таблицу (вызывается при клике в таблицу)
      setActiveTable: (tableId) => {
        set({ activeTableId: tableId });
      },

      // Получить активный selection store
      getActiveSelectionStore: () => {
        const { activeTableId } = get();
        if (activeTableId === 'offset') {
          return useOffsetSelectionStore;
        }
        return useMainSelectionStore;
      },

      // Проверить есть ли выделение в какой-либо таблице
      hasAnySelection: () => {
        const mainHas = useMainSelectionStore.getState().hasSelection();
        const offsetHas = useOffsetSelectionStore.getState().hasSelection();
        return mainHas || offsetHas;
      },

      // Очистить выделение во всех таблицах
      clearAllSelections: () => {
        useMainSelectionStore.getState().clearSelection();
        useOffsetSelectionStore.getState().clearSelection();
        set({ activeTableId: null });
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
}));
