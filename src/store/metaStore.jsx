import {create} from 'zustand';
import { devtools } from 'zustand/middleware';

export const useMetaStore = create(
  devtools((set, get) => ({
    // === STATE ===
    departmentsList: [],
    currentDepartmentConfig: null,

    isDepartmentsLoaded: false, 
    
    loading: {
      departmentsList: false,
      config: false,
      employees: false
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
        const response = await fetch('../../public/department-list.json');
        const data = await response.json();
        
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
        const response = await fetch(`../../public/departments-config-${departmentId}.json`);
        const data = await response.json();
        
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
    },
    
    // Обновление конфига через WebSocket
    // updateDepartmentConfig: (config) => {
    //   const currentConfig = get().currentDepartmentConfig;
      
    //   // Обновляем только если это текущий отдел
    //   if (currentConfig?.departmentId === config.departmentId) {
    //     set({ currentDepartmentConfig: config });
    //   }
    // }
  }), { name: 'MetaStore' })
);

export default useMetaStore 