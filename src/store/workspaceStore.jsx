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

    // Загрузить данные для всех видимых годов
    loadVisibleYearsData: async () => {
      const departmentId = get().currentDepartmentId;
      if (!departmentId) return;

      const dateStore = useDateStore.getState();
      const visibleYears = dateStore.getVisibleYears();
      const scheduleStore = useScheduleStore.getState();

      // Загружаем данные для каждого года, которого еще нет
      for (const year of visibleYears) {
        if (!scheduleStore.loadedYears.has(year)) {
          await scheduleStore.loadSchedule(departmentId, year);
        }
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