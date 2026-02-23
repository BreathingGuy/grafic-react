import { create } from 'zustand';
import { useMetaStore } from '../metaStore';
import { buildCodeToHours, calcFullHoursSummary, deltaUpdateSummary, batchDeltaUpdateSummary } from '../../utils/hoursCalc';

export const useHoursStore = create((set, get) => ({
  // === STATE ===
  hoursSummary: {},              // Факт часов: { "empId-Q1": 480, "empId-Q2": 512, ... }
  codeToHours: {},               // Карта code→hours: { "Д": 8, "В": 0, ... }
  monthNorms: {},                // Нормы часов по месяцам: { "2025-01": 160, ... }
  showQuarterSummary: JSON.parse(localStorage.getItem('admin-showQuarterSummary') || 'false'),

  // === ACTIONS ===

  toggleQuarterSummary: () => {
    const next = !get().showQuarterSummary;
    set({ showQuarterSummary: next });
    localStorage.setItem('admin-showQuarterSummary', JSON.stringify(next));
  },

  // Пересчитать hoursSummary полностью (при init, undo, discard)
  recalcHoursSummary: (draftSchedule, employeeIds, editingYear) => {
    const { codeToHours } = get();
    if (!editingYear || Object.keys(codeToHours).length === 0) {
      set({ hoursSummary: {} });
      return;
    }
    const summary = calcFullHoursSummary(draftSchedule, employeeIds, codeToHours, editingYear);
    set({ hoursSummary: summary });
  },

  // Обновить codeToHours из текущего statusConfig
  refreshCodeToHours: () => {
    const config = useMetaStore.getState().currentDepartmentConfig;
    const map = buildCodeToHours(config?.statusConfig);
    set({ codeToHours: map });
  },

  // Дельта-обновление одной ячейки
  deltaUpdate: (empId, dateStr, oldStatus, newStatus) => {
    const { hoursSummary, codeToHours } = get();
    const newSummary = deltaUpdateSummary(hoursSummary, empId, dateStr, oldStatus, newStatus, codeToHours);
    if (newSummary) {
      set({ hoursSummary: newSummary });
    }
  },

  // Дельта-обновление пакета ячеек
  batchDeltaUpdate: (updates, oldSchedule, editingYear) => {
    const { hoursSummary, codeToHours } = get();
    const newSummary = batchDeltaUpdateSummary(hoursSummary, updates, oldSchedule, codeToHours, editingYear);
    set({ hoursSummary: newSummary });
  },

  // Установить нормы месяцев
  setMonthNorms: (norms) => {
    set({ monthNorms: norms || {} });
  },

  // Сброс при смене года/отдела
  clearHours: () => {
    set({
      hoursSummary: {},
      codeToHours: {},
      monthNorms: {}
    });
  }
}));

export default useHoursStore;
