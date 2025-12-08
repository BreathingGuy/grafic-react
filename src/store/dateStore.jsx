import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MONTHS } from '../constants/index';

// ======================================================
// 📅 ГЕНЕРАЦИЯ СТАТИЧНОГО ИНДЕКСА ДАТ (один раз при загрузке модуля)
// ======================================================

const generateDateIndex = (startYear, endYear) => {
  const datesByYear = {};
  const datesByMonth = {};
  const allDates = [];

  for (let year = startYear; year <= endYear; year++) {
    datesByYear[year] = [];

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      datesByMonth[monthKey] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        allDates.push(dateStr);
        datesByYear[year].push(dateStr);
        datesByMonth[monthKey].push(dateStr);
      }
    }
  }

  return { allDates, datesByYear, datesByMonth };
};

// Генерируем индекс для диапазона 2020-2035 (один раз!)
const DATE_INDEX = generateDateIndex(2024, 2026);

// ======================================================
// 🎯 ZUSTAND STORE
// ======================================================

export const useDateStore = create(
  devtools((set, get) => ({
    // === STATE ===

    // Статичные индексы (не меняются)
    allDates: DATE_INDEX.allDates,
    datesByYear: DATE_INDEX.datesByYear,
    datesByMonth: DATE_INDEX.datesByMonth,

    // Текущее состояние навигации
    currentYear: new Date().getFullYear(),
    period: '3months',                      // По умолчанию 3 месяца
    baseDate: new Date(),                   // Базовая дата для расчета диапазона

    // 🎯 СИСТЕМА СЛОТОВ - ключевая оптимизация!
    // visibleSlots - ФИКСИРОВАННЫЙ массив индексов (никогда не меняется!)
    // При навигации меняется только slotToDate mapping
    visibleSlots: Array.from({ length: 90 }, (_, i) => i),  // [0, 1, 2, ..., 89] - 90 дней (~3 месяца)
    slotToDate: {},                         // { 0: "2025-01-01", 1: "2025-01-02", ... }

    // Для заголовков таблицы
    monthGroups: [],

    // === ИНИЦИАЛИЗАЦИЯ ===

    initialize: () => {
      const { period, baseDate, currentYear } = get();

      // Вычисляем даты для текущего периода
      const dates = get().calculateVisibleDates(period, baseDate, currentYear);

      // Создаем mapping слот → дата
      const slotToDate = {};
      dates.forEach((date, index) => {
        slotToDate[index] = date;
      });

      // Вычисляем группировку по месяцам
      const groups = get().calculateMonthGroups(dates);

      set({
        slotToDate,
        monthGroups: groups
      });
    },

    // === ВЫЧИСЛЕНИЕ ВИДИМЫХ ДАТ (используем индекс, не пересоздаем даты!) ===

    calculateVisibleDates: (period, baseDate, year) => {
      if (period === '1year') {
        // ✅ O(1) - просто возвращаем ссылку на массив
        return get().datesByYear[year] || [];
      }

      if (period === '3months') {
        // ✅ O(1) - получаем квартал
        const quarter = Math.floor(baseDate.getMonth() / 3);
        return get().getQuarterDates(year, quarter);
      }

      return [];
    },

    // Получить даты квартала
    getQuarterDates: (year, quarter) => {
      const dates = [];
      const startMonth = quarter * 3;

      for (let i = 0; i < 3; i++) {
        const month = startMonth + i;
        if (month < 12) {
          const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
          const monthDates = get().datesByMonth[monthKey] || [];
          dates.push(...monthDates);
        }
      }

      return dates;
    },

    // Получить даты недели (с понедельника по воскресенье)
    getWeekDates: (baseDate) => {
      const dates = [];
      const currentDate = new Date(baseDate);

      // Найти понедельник текущей недели
      const dayOfWeek = currentDate.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      currentDate.setDate(currentDate.getDate() + mondayOffset);

      // Собрать 7 дней
      for (let i = 0; i < 7; i++) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        dates.push(dateStr);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return dates;
    },

    // Вычислить группировку по месяцам для заголовков
    calculateMonthGroups: (dates) => {
      if (dates.length === 0) return [];

      const monthGroups = [];
      let currentMonth = null;
      let colspan = 0;

      dates.forEach(dateStr => {
        const d = new Date(dateStr);
        const monthIndex = d.getMonth();

        if (monthIndex !== currentMonth) {
          if (colspan > 0) {
            monthGroups.push({ month: MONTHS[currentMonth], colspan });
          }
          currentMonth = monthIndex;
          colspan = 1;
        } else {
          colspan++;
        }
      });

      if (colspan > 0) {
        monthGroups.push({ month: MONTHS[currentMonth], colspan });
      }

      return monthGroups;
    },

    // === ACTIONS ===

    // Установить период
    setPeriod: (newPeriod) => {
      const { baseDate, currentYear } = get();

      set({ period: newPeriod });

      // Пересчитать видимые даты
      const dates = get().calculateVisibleDates(newPeriod, baseDate, currentYear);

      // Обновить mapping слот → дата
      const slotToDate = {};
      dates.forEach((date, index) => {
        slotToDate[index] = date;
      });

      const groups = get().calculateMonthGroups(dates);

      set({
        slotToDate,
        monthGroups: groups
      });
    },

    // Навигация (вперед/назад) - КЛЮЧЕВОЙ МЕТОД!
    // Меняется только slotToDate, visibleSlots остается неизменным
    shiftDates: (direction) => {
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

      set({
        baseDate: newDate,
        currentYear: newYear
      });

      // Пересчитать видимые даты
      const dates = get().calculateVisibleDates(period, newDate, newYear);

      // 🎯 Обновляем только slotToDate - visibleSlots остается [0,1,2,...89]!
      const slotToDate = {};
      dates.forEach((date, index) => {
        slotToDate[index] = date;
      });

      const groups = get().calculateMonthGroups(dates);

      set({
        slotToDate,       // ← Меняется только это!
        monthGroups: groups
      });
    },

    // Установить базовую дату
    setBaseDate: (date) => {
      const { period } = get();
      const newDate = new Date(date);
      const newYear = newDate.getFullYear();

      set({
        baseDate: newDate,
        currentYear: newYear
      });

      // Пересчитать видимые даты
      const dates = get().calculateVisibleDates(period, newDate, newYear);

      const slotToDate = {};
      dates.forEach((date, index) => {
        slotToDate[index] = date;
      });

      const groups = get().calculateMonthGroups(dates);

      set({
        slotToDate,
        monthGroups: groups
      });
    },

    // Переход на конкретный год
    setYear: (year) => {
      const newBaseDate = new Date(year, 0, 1); // 1 января

      set({
        currentYear: year,
        baseDate: newBaseDate
      });

      // Пересчитать видимые даты
      const { period } = get();
      const dates = get().calculateVisibleDates(period, newBaseDate, year);

      const slotToDate = {};
      dates.forEach((date, index) => {
        slotToDate[index] = date;
      });

      const groups = get().calculateMonthGroups(dates);

      set({
        slotToDate,
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

      // Пересчитать видимые даты
      const { period } = get();
      const dates = get().calculateVisibleDates(period, newBaseDate, currentYear);

      const slotToDate = {};
      dates.forEach((date, index) => {
        slotToDate[index] = date;
      });

      const groups = get().calculateMonthGroups(dates);

      set({
        slotToDate,
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