import create from 'zustand';
import { devtools } from 'zustand/middleware';

export const useMetaStore = create(
  devtools((set, get) => ({
    // === STATE ===
    departmentsList: [],           // Список всех отделов
    allEmployees: [],              // Все сотрудники (для поиска)
    
    currentDepartmentConfig: null, // Конфиг текущего отдела
    // {
    //   departmentId, 
    //   name, 
    //   statusConfig: [{code, label, color}],
    //   employees: [{id, name, position}],
    //   settings
    // }
    
    loading: {
      departmentsList: false,
      config: false
    },
    
    // === ACTIONS ===
    
    loadDepartmentsList: async () => {
      set({ loading: { ...get().loading, departmentsList: true } });
      
      // const response = await api.get('/api/departments/list');
      // set({ departmentsList: response.departments });
      
      set({ loading: { ...get().loading, departmentsList: false } });
    },
    
    loadDepartmentConfig: async (departmentId) => {
      set({ loading: { ...get().loading, config: true } });
      
      // const response = await api.get(`/api/departments/${departmentId}/config`);
      // set({ currentDepartmentConfig: response });
      
      set({ loading: { ...get().loading, config: false } });
    },
    
    loadAllEmployees: async () => {
      // Загружаем всех сотрудников для поиска
      // const response = await api.get('/api/employees/all');
      // set({ allEmployees: response.employees });
    },
    
    // Очистить конфиг при переключении отдела
    clearCurrentConfig: () => {
      set({ currentDepartmentConfig: null });
    }
  }), { name: 'MetaStore' })
);