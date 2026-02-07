import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useFetchWebStore } from './fetchWebStore';

/**
 * versionsStore - отдельный стор для версий года
 * Изолирован от adminStore чтобы загрузка версий не триггерила
 * ре-рендер компонентов подписанных на employeeIds
 */
export const useVersionsStore = create(
  devtools(
    (set) => ({
      // State
      yearVersions: [],              // Версии выбранного года: ["2025.02.15", "2025.03.16", ...]
      selectedVersion: null,         // Выбранная версия (null = текущий draft)
      loadingVersions: false,

      // Actions

      /**
       * Загрузить версии для выбранного года
       */
      loadYearVersions: async (departmentId, year) => {
        console.log(`📥 fetchYearVersions: ${departmentId}/${year}`);
        set({ loadingVersions: true, yearVersions: [] });

        try {
          const fetchStore = useFetchWebStore.getState();
          const data = await fetchStore.fetchYearVersions(departmentId, year);

          set({
            yearVersions: data.versions || [],
            loadingVersions: false
          });

          return data.versions;
        } catch (error) {
          console.error('loadYearVersions error:', error);
          set({ loadingVersions: false });
          throw error;
        }
      },

      /**
       * Установить выбранную версию
       */
      setSelectedVersion: (version) => {
        set({ selectedVersion: version });
      },

      /**
       * Сбросить состояние версий (при смене года/отдела)
       */
      resetVersions: () => {
        set({
          yearVersions: [],
          selectedVersion: null,
          loadingVersions: false
        });
      }
    }),
    { name: 'VersionsStore' }
  )
);

export default useVersionsStore;
