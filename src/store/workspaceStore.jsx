import { create } from 'zustand';

import { useMetaStore } from './metaStore'
import { useScheduleStore } from './scheduleStore'
import { useDateUserStore } from './dateUserStore'
import { useAdminStore } from './adminStore'
import { useClipboardStore } from './selection'

export const useWorkspaceStore = create((set, get) => ({
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
      const scheduleStore = useScheduleStore.getState();
      const dateUserStore = useDateUserStore.getState();

      // Очищаем старые данные
      if (prevDepartmentId) {
        metaStore.clearCurrentConfig();
        scheduleStore.clearSchedule();
      }

      // Получаем текущий год из dateUserStore
      const currentYear = dateUserStore.currentYear;

      // Загружаем новые
      await metaStore.loadDepartmentConfig(departmentId);
      await scheduleStore.loadSchedule(departmentId, currentYear);

      // Подписываемся на WebSocket
      // scheduleStore.subscribeToUpdates(departmentId);
    },

    // Выбрать отдел (для admin mode — только меняет ID, без загрузки user data)
    // AdminConsole сам загрузит данные через initializeDraft
    setAdminDepartment: (departmentId) => {
      const prevDepartmentId = get().currentDepartmentId;

      if (prevDepartmentId === departmentId) return;

      // Очистки как при смене года (без сброса isAdminMode)
      useClipboardStore.getState().clearAllSelections();
      useAdminStore.getState().clearDraftData();

      set({ currentDepartmentId: departmentId });

      // AdminConsole.useEffect подхватит изменение currentDepartmentId
      // и вызовет initializeDraft
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
}));

export default useWorkspaceStore