import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { useMetaStore } from './metaStore'
import { useUserStore } from './userStore'
import { useDateUserStore } from './dateUserStore'
import { useDateAdminStore } from './dateAdminStore'
import { enterAdminContext } from '../services/adminOrchestrator'

export const useWorkspaceStore = create(devtools((set, get) => ({
    // === STATE ===
    currentDepartmentId: null,

    // === ACTIONS ===

    // Выбрать отдел (для user mode — загружает user data)
    setDepartment: async (departmentId) => {
      const prevDepartmentId = get().currentDepartmentId;

      if (prevDepartmentId === departmentId) return;

      set({ currentDepartmentId: departmentId });

      // Загружаем данные для нового отдела
      const metaStore = useMetaStore.getState();
      const userStore = useUserStore.getState();
      const dateUserStore = useDateUserStore.getState();

      // Очищаем старые данные
      if (prevDepartmentId) {
        metaStore.clearCurrentConfig();
        userStore.clearSchedule();
      }

      // Получаем текущий год из dateUserStore
      const currentYear = dateUserStore.currentYear;

      // Загружаем новые
      await metaStore.loadDepartmentConfig(departmentId);
      await userStore.loadSchedule(departmentId, currentYear);

    },

    // Выбрать отдел (для admin mode)
    // Использует единую точку входа enterAdminContext
    setAdminDepartment: async (departmentId) => {
      const prevDepartmentId = get().currentDepartmentId;

      if (prevDepartmentId === departmentId) return;

      set({ currentDepartmentId: departmentId });

      // Используем текущий год из dateAdminStore или текущий календарный год
      const currentYear = useDateAdminStore.getState().currentYear || new Date().getFullYear();

      // Координация через оркестратор
      await enterAdminContext(departmentId, currentYear);
    },

    // Навигация по годам — загружаем данные для нового года
    loadYearData: async (year) => {
      const departmentId = get().currentDepartmentId;
      if (departmentId) {
        await useUserStore.getState().loadSchedule(departmentId, year);
      }
    },

    // Сброс (при выходе или переходе на главную)
    reset: () => {
      set({
        currentDepartmentId: null
      });

      useMetaStore.getState().clearCurrentConfig();
      useUserStore.getState().clearCache();
      useDateUserStore.getState().resetToCurrentYear();
    }
}), { name: 'WorkspaceStore' }));

export default useWorkspaceStore