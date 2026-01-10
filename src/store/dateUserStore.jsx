import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  DATE_INDEX,
  START_YEAR,
  END_YEAR,
  VISIBLE_SLOTS,
  createSlotMapping,
  calculateMonthGroups,
  getYearDates,
  getQuarterDates,
  getMonthDates,
  getWeekDates
} from '../utils/dateIndex';

/**
 * dateUserStore — управление датами для User View
 *
 * Поддерживает периоды: 7days, 1month, 3months, 1year
 * Навигация вперёд/назад с проверкой границ
 */
export const useDateUserStore = create(
  devtools((set, get) => ({
    // === STATE ===

    // Границы навигации
    minYear: START_YEAR,
    maxYear: END_YEAR,

    // Текущее состояние навигации
    currentYear: new Date().getFullYear(),
    period: '3months',
    periods: ['3months', '1month', '7days', '1year'],
    baseDate: new Date(),

    // Система слотов
    visibleSlots: VISIBLE_SLOTS,
    slotToDate: {},
    slotToDay: {},

    // Для заголовков таблицы
    monthGroups: [],

    // === ИНИЦИАЛИЗАЦИЯ ===

    initialize: () => {
      const { period, baseDate, currentYear } = get();
      const dates = get().calculateVisibleDates(period, baseDate, currentYear);
      get().updateSlots(dates);
    },

    // === HELPER ФУНКЦИИ ===

    updateSlots: (dates) => {
      const { slotToDate, slotToDay } = createSlotMapping(dates);
      const monthGroups = calculateMonthGroups(dates);

      set({ slotToDate, slotToDay, monthGroups });
    },

    // === ВЫЧИСЛЕНИЕ ВИДИМЫХ ДАТ ===

    calculateVisibleDates: (period, baseDate, year) => {
      if (period === '1year') {
        return getYearDates(year);
      }

      if (period === '3months') {
        const quarter = Math.floor(baseDate.getMonth() / 3) + 1;
        return getQuarterDates(year, quarter);
      }

      if (period === '1month') {
        const month = baseDate.getMonth();
        return getMonthDates(year, month);
      }

      if (period === '7days') {
        return getWeekDates(baseDate);
      }

      return [];
    },

    // === ПРОВЕРКИ ГРАНИЦ НАВИГАЦИИ ===

    canGoNext: () => {
      const { period, baseDate, currentYear, maxYear } = get();

      if (period === '1year') {
        return currentYear < maxYear;
      }

      if (period === '3months') {
        const quarter = Math.floor(baseDate.getMonth() / 3);
        return !(currentYear === maxYear && quarter === 3);
      }

      if (period === '1month') {
        const month = baseDate.getMonth();
        return !(currentYear === maxYear && month === 11);
      }

      if (period === '7days') {
        const newDate = new Date(baseDate);
        newDate.setDate(newDate.getDate() + 7);
        return newDate.getFullYear() <= maxYear;
      }

      return false;
    },

    canGoPrev: () => {
      const { period, baseDate, currentYear, minYear } = get();

      if (period === '1year') {
        return currentYear > minYear;
      }

      if (period === '3months') {
        const quarter = Math.floor(baseDate.getMonth() / 3);
        return !(currentYear === minYear && quarter === 0);
      }

      if (period === '1month') {
        const month = baseDate.getMonth();
        return !(currentYear === minYear && month === 0);
      }

      if (period === '7days') {
        const newDate = new Date(baseDate);
        newDate.setDate(newDate.getDate() - 7);
        return newDate.getFullYear() >= minYear;
      }

      return false;
    },

    // === ACTIONS ===

    setPeriod: (newPeriod) => {
      const { baseDate, currentYear } = get();
      set({ period: newPeriod });

      const dates = get().calculateVisibleDates(newPeriod, baseDate, currentYear);
      get().updateSlots(dates);
    },

    shiftDates: (direction) => {
      if (direction === 'next' && !get().canGoNext()) {
        console.log('⚠️ Достигнут максимальный предел навигации');
        return;
      }
      if (direction === 'prev' && !get().canGoPrev()) {
        console.log('⚠️ Достигнут минимальный предел навигации');
        return;
      }

      const { period, baseDate, currentYear } = get();
      const newDate = new Date(baseDate);
      let newYear = currentYear;

      if (period === '3months') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
        newYear = newDate.getFullYear();
      } else if (period === '1month') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        newYear = newDate.getFullYear();
      } else if (period === '7days') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        newYear = newDate.getFullYear();
      } else if (period === '1year') {
        newYear = currentYear + (direction === 'next' ? 1 : -1);
        newDate.setFullYear(newYear);
      }

      set({ baseDate: newDate, currentYear: newYear });

      const dates = get().calculateVisibleDates(period, newDate, newYear);
      get().updateSlots(dates);
    },

    setBaseDate: (date) => {
      const { period } = get();
      const newDate = new Date(date);
      const newYear = newDate.getFullYear();

      set({ baseDate: newDate, currentYear: newYear });

      const dates = get().calculateVisibleDates(period, newDate, newYear);
      get().updateSlots(dates);
    },

    setYear: (year) => {
      const { minYear, maxYear } = get();

      if (year < minYear || year > maxYear) {
        console.log(`⚠️ Год ${year} за пределами допустимого диапазона (${minYear}-${maxYear})`);
        return;
      }

      const newBaseDate = new Date(year, 0, 1);

      set({ currentYear: year, baseDate: newBaseDate });

      const { period } = get();
      const dates = get().calculateVisibleDates(period, newBaseDate, year);
      get().updateSlots(dates);
    },

    resetToCurrentYear: () => {
      const currentYear = new Date().getFullYear();
      const newBaseDate = new Date();

      set({ currentYear, baseDate: newBaseDate });

      const { period } = get();
      const dates = get().calculateVisibleDates(period, newBaseDate, currentYear);
      get().updateSlots(dates);
    },

    getCurrentYear: () => {
      return get().currentYear;
    }

  }), { name: 'DateUserStore' })
);

// Для обратной совместимости (временно)
export const useDateStore = useDateUserStore;

export default useDateUserStore;
