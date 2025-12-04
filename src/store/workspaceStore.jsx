import {create} from 'zustand';
import { devtools } from 'zustand/middleware';

import { useMetaStore } from './metaStore'
import { useScheduleStore } from './scheduleStore'

export const useWorkspaceStore = create(
  devtools((set, get) => ({
    // === STATE ===
    currentDepartmentId: null,
    currentYear: new Date().getFullYear(), // Начинаем с текущего года
    
    // === ACTIONS ===
    
    // Выбрать отдел
    setDepartment: async (departmentId) => {
      const prevDepartmentId = get().currentDepartmentId;
      
      if (prevDepartmentId === departmentId) return;
      
      set({ currentDepartmentId: departmentId });
      
      // Загружаем данные для нового отдела
      const metaStore = useMetaStore.getState();
      const scheduleStore = useScheduleStore.getState();
      
      // Очищаем старые данные
      if (prevDepartmentId) {
        metaStore.clearCurrentConfig();
        scheduleStore.clearSchedule();
      }
      
      // Загружаем новые
      await metaStore.loadDepartmentConfig(departmentId);
      await scheduleStore.loadSchedule(departmentId, get().currentYear);
      
      // Подписываемся на WebSocket
      // scheduleStore.subscribeToUpdates(departmentId);
    },
    
    // Навигация по годам
    goToPreviousYear: async () => {
      const newYear = get().currentYear - 1;
      set({ currentYear: newYear });
      
      // Перезагружаем расписание
      const departmentId = get().currentDepartmentId;
      if (departmentId) {
        await useScheduleStore.getState().loadSchedule(departmentId, newYear);
      }
    },
    
    goToNextYear: async () => {
      const newYear = get().currentYear + 1;
      set({ currentYear: newYear });
      
      // Перезагружаем расписание
      const departmentId = get().currentDepartmentId;
      if (departmentId) {
        await useScheduleStore.getState().loadSchedule(departmentId, newYear);
      }
    },
    
    setYear: async (year) => {
      set({ currentYear: year });
      
      // Перезагружаем расписание
      const departmentId = get().currentDepartmentId;
      if (departmentId) {
        await useScheduleStore.getState().loadSchedule(departmentId, year);
      }
    },
    
    // Сброс (при выходе или переходе на главную)
    reset: () => {
      set({
        currentDepartmentId: null,
        currentYear: new Date().getFullYear()
      });
      
      useMetaStore.getState().clearCurrentConfig();
      useScheduleStore.getState().clearSchedule();
    }
  }), { name: 'WorkspaceStore' })
);

export default useWorkspaceStore