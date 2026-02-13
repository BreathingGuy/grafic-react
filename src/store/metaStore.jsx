import { create } from 'zustand';
import { useFetchWebStore } from './fetchWebStore';

export const useMetaStore = create((set, get) => ({
    // === STATE ===
    departmentsList: [],
    currentDepartmentConfig: null,
    // Карта: { "Д": { colorText, colorBack }, "Н1": { ... }, ... }
    statusColorMap: {},

    isDepartmentsLoaded: false,

    loading: {
      departmentsList: false,
      config: false
    },

    // === HELPERS ===

    // Построить statusColorMap из statusConfig
    buildColorMap: (config) => {
      if (!config?.statusConfig) return {};
      const map = {};
      config.statusConfig.forEach(s => {
        map[s.code] = { colorText: s.colorText, colorBack: s.colorBack };
      });
      return map;
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
          statusColorMap: get().buildColorMap(data),
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
      set({ currentDepartmentConfig: null, statusColorMap: {} });
    }

    // === WEBSOCKET (закомментирован) ===
    // updateDepartmentConfig: (config) => { ... }

}));

export default useMetaStore;
