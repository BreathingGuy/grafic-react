import {create} from 'zustand';
import { devtools } from 'zustand/middleware';

import { useMetaStore } from './metaStore'
import { useScheduleStore } from './scheduleStore'
import { useDateUserStore } from './dateUserStore'
import { useAdminStore } from './adminStore'
import { useFetchWebStore } from './fetchWebStore'

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
      const dateUserStore = useDateUserStore.getState();
      const adminStore = useAdminStore.getState();
      const fetchStore = useFetchWebStore.getState();

      // Очищаем старые данные
      if (prevDepartmentId) {
        metaStore.clearCurrentConfig();
        scheduleStore.clearCache(); // Очистить кэш полностью, а не только schedule
      }

      // Проверяем, находимся ли в админ режиме
      const isAdminMode = adminStore.isAdminMode;

      // Загружаем конфигурацию нового отдела
      await metaStore.loadDepartmentConfig(departmentId);

      if (isAdminMode) {
        // === АДМИН РЕЖИМ ===
        console.log(`📋 Переключение отдела в админ режиме: ${departmentId}`);

        // Загружаем доступные годы для нового отдела
        const yearsData = await fetchStore.fetchDepartmentYears(departmentId);
        const availableYears = yearsData.years || [];

        if (availableYears.length === 0) {
          console.warn(`⚠️ У отдела ${departmentId} нет доступных годов`);
          return;
        }

        // Определяем, какой год использовать
        const currentAdminYear = adminStore.editingYear;
        const currentUserYear = dateUserStore.currentYear;

        let targetYear;
        if (currentAdminYear && availableYears.includes(String(currentAdminYear))) {
          // Текущий админский год доступен - используем его
          targetYear = currentAdminYear;
        } else if (availableYears.includes(String(currentUserYear))) {
          // Используем текущий год пользователя, если доступен
          targetYear = currentUserYear;
        } else {
          // Используем последний доступный год
          targetYear = Number(availableYears[availableYears.length - 1]);
        }

        console.log(`📅 Выбран год для админ режима: ${targetYear}`);

        // Устанавливаем контекст редактирования
        await adminStore.setEditingContext(departmentId, targetYear);

      } else {
        // === ПОЛЬЗОВАТЕЛЬСКИЙ РЕЖИМ ===
        console.log(`👤 Переключение отдела в пользовательском режиме: ${departmentId}`);

        // Получаем текущий год из dateUserStore
        const currentYear = dateUserStore.currentYear;

        // Загружаем расписание
        await scheduleStore.loadSchedule(departmentId, currentYear);
      }

      // Подписываемся на WebSocket
      // scheduleStore.subscribeToUpdates(departmentId);
    },

    // Навигация по годам — загружаем данные для нового года
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
      useDateUserStore.getState().resetToCurrentYear();
    }
  }), { name: 'WorkspaceStore' })
);

export default useWorkspaceStore