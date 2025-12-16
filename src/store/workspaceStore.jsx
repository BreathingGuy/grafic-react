import {create} from 'zustand';
import { devtools } from 'zustand/middleware';

import { useMetaStore } from './metaStore'
import { useScheduleStore } from './scheduleStore'
import { useDateStore } from './dateStore'

export const useWorkspaceStore = create(
  devtools((set, get) => ({
    // === STATE ===
    currentDepartmentId: null,

    // === ACTIONS ===
    
    // Выбрать отдел
    setDepartment: async (departmentId) => {      
      const prevDepartmentId = get().currentDepartmentId;

      if (prevDepartmentId === departmentId) return;

      set({ currentDepartmentId: departmentId });

      // Загружаем данные для нового отдела
      const metaStore = useMetaStore.getState();
      const scheduleStore = useScheduleStore.getState();
      const dateStore = useDateStore.getState();

      // Очищаем старые данные
      if (prevDepartmentId) {
        metaStore.clearCurrentConfig();
        scheduleStore.clearSchedule();
      }

      // Получаем текущий год из dateStore
      const currentYear = dateStore.currentYear;

      // Загружаем новые
      await metaStore.loadDepartmentConfig(departmentId);
      await scheduleStore.loadSchedule(departmentId, currentYear);

      // Подписываемся на WebSocket
      // scheduleStore.subscribeToUpdates(departmentId);
    },
    
    // Навигация по годам теперь в dateStore
    // При изменении года в dateStore - загружаем данные для нового года
    loadYearData: async (year) => {
      const departmentId = get().currentDepartmentId;
      if (departmentId) {
        await useScheduleStore.getState().loadSchedule(departmentId, year);
      }
    },
    
    // Сброс (при выходе или переходе на главную)
    reset: () => {
      set({
        currentDepartmentId: null
      });

      useMetaStore.getState().clearCurrentConfig();
      useScheduleStore.getState().clearCache();
      useDateStore.getState().resetToCurrentYear();
    }
  }), { name: 'WorkspaceStore' })
);

export default useWorkspaceStore