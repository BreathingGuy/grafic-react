import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useFetchWebStore } from './fetchWebStore';

export const useMetaStore = create(
  devtools((set, get) => ({
    // === STATE ===
    departmentsList: [],
    currentDepartmentConfig: null,

    isDepartmentsLoaded: false,

    loading: {
      departmentsList: false,
      config: false
    },

    // === ACTIONS ===

    loadDepartmentsList: async () => {
      if (get().isDepartmentsLoaded || get().loading.departmentsList) {
        return;
      }

      set(state => ({
        loading: { ...state.loading, departmentsList: true }
      }));

      try {
        const fetchStore = useFetchWebStore.getState();
        const data = await fetchStore.fetchDepartmentsList();

        set({
          departmentsList: data.departments,
          isDepartmentsLoaded: true,
          loading: { ...get().loading, departmentsList: false }
        });
      } catch (error) {
        console.error('Failed to load departments:', error);
        set(state => ({
          loading: { ...state.loading, departmentsList: false }
        }));
      }
    },

    loadDepartmentConfig: async (departmentId) => {
      set(state => ({
        loading: { ...state.loading, config: true }
      }));

      try {
        const fetchStore = useFetchWebStore.getState();
        const data = await fetchStore.fetchDepartmentConfig(departmentId);

        set({
          currentDepartmentConfig: data,
          loading: { ...get().loading, config: false }
        });
      } catch (error) {
        console.error('Failed to load config:', error);
        set(state => ({
          loading: { ...state.loading, config: false }
        }));
      }
    },

    clearCurrentConfig: () => {
      set({ currentDepartmentConfig: null });
    }

    // === WEBSOCKET (закомментирован) ===
    // updateDepartmentConfig: (config) => { ... }

  }), { name: 'MetaStore' })
);

export default useMetaStore;
