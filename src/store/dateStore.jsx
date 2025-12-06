import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getDateRange } from '../utils/dateHelpers';

export const useDateStore = create(
  devtools((set, get) => ({
    // === STATE ===
    currentYear: new Date().getFullYear(), // Текущий год для загрузки данных
    period: '1year',                       // Период отображения: '7days' | '1month' | '3months' | '1year'
    baseDate: new Date(),                  // Базовая дата для расчета диапазона

    // Вычисляемые значения (кешируются)
    visibleDates: [],                      // Массив дат для отображения в таблице
    monthGroups: [],                       // Группировка по месяцам для заголовков

    // === ACTIONS ===

    // Инициализация - вычислить начальный диапазон дат
    initialize: () => {
      const { period, baseDate } = get();
      const [dates, groups] = getDateRange(period, baseDate);
      set({
        visibleDates: dates,
        monthGroups: groups
      });
    },

    // Установить период отображения
    setPeriod: (newPeriod) => {
      set({ period: newPeriod });

      // Пересчитать диапазон дат для нового периода
      const { baseDate } = get();
      const [dates, groups] = getDateRange(newPeriod, baseDate);

      set({
        visibleDates: dates,
        monthGroups: groups
      });
    },

    // Навигация по датам (вперед/назад)
    shiftDates: (direction) => {
      const { period, baseDate } = get();
      const newDate = new Date(baseDate);

      if (period === '3months') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
      } else if (period === '1month') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      } else if (period === '7days') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      } else if (period === '1year') {
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        // При переходе на другой год - обновляем currentYear
        set({ currentYear: newDate.getFullYear() });
      }

      set({ baseDate: newDate });

      // Пересчитать диапазон дат
      const [dates, groups] = getDateRange(period, newDate);
      set({
        visibleDates: dates,
        monthGroups: groups
      });
    },

    // Установить базовую дату напрямую
    setBaseDate: (date) => {
      set({ baseDate: new Date(date) });

      // Пересчитать диапазон дат
      const { period } = get();
      const [dates, groups] = getDateRange(period, new Date(date));

      set({
        visibleDates: dates,
        monthGroups: groups
      });
    },

    // Переход на конкретный год
    setYear: (year) => {
      const newBaseDate = new Date(year, 0, 1); // 1 января нового года

      set({
        currentYear: year,
        baseDate: newBaseDate
      });

      // Пересчитать диапазон дат
      const { period } = get();
      const [dates, groups] = getDateRange(period, newBaseDate);

      set({
        visibleDates: dates,
        monthGroups: groups
      });
    },

    // Сброс к текущему году
    resetToCurrentYear: () => {
      const currentYear = new Date().getFullYear();
      const newBaseDate = new Date();

      set({
        currentYear,
        baseDate: newBaseDate
      });

      // Пересчитать диапазон дат
      const { period } = get();
      const [dates, groups] = getDateRange(period, newBaseDate);

      set({
        visibleDates: dates,
        monthGroups: groups
      });
    },

    // Получить текущий год (для загрузки данных)
    getCurrentYear: () => {
      return get().currentYear;
    }

  }), { name: 'DateStore' })
);

export default useDateStore;
