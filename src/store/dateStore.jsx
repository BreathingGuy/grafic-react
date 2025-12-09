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

    // 🎯 ВИРТУАЛИЗАЦИЯ - динамическая загрузка месяцев
    loadedDates: [],                        // Все загруженные даты (растет при скролле)
    visibleSlots: [],                       // Динамический массив индексов
    slotToDate: {},                         // { 0: "2025-01-01", 1: "2025-01-02", ... }

    // Состояние загрузки
    isLoadingMore: false,                   // Идет ли загрузка следующих месяцев
    canLoadMore: true,                      // Можно ли загрузить еще месяцы
    loadingProgress: 0,                     // Прогресс загрузки (0-100) для круга

    // Для заголовков таблицы
    monthGroups: [],

    // === ИНИЦИАЛИЗАЦИЯ ===

    initialize: () => {
      const { baseDate, currentYear } = get();

      // Для виртуализации загружаем начальные 3 месяца
      const initialDates = get().getNext3MonthsFrom(baseDate, currentYear);

      // Создаем visibleSlots динамически
      const visibleSlots = Array.from({ length: initialDates.length }, (_, i) => i);

      // Создаем mapping слот → дата
      const slotToDate = {};
      initialDates.forEach((date, index) => {
        slotToDate[index] = date;
      });

      // Вычисляем группировку по месяцам
      const groups = get().calculateMonthGroups(initialDates);

      set({
        loadedDates: initialDates,
        visibleSlots,
        slotToDate,
        monthGroups: groups,
        canLoadMore: true
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

    // 🎯 ВИРТУАЛИЗАЦИЯ - получить следующие 3 месяца от указанной даты
    getNext3MonthsFrom: (fromDate, year) => {
      const dates = [];
      const startDate = new Date(fromDate);
      const startMonth = startDate.getMonth();
      const startYear = year || startDate.getFullYear();

      // Загружаем 3 месяца начиная с текущего
      for (let i = 0; i < 3; i++) {
        const month = startMonth + i;
        const actualYear = startYear + Math.floor(month / 12);
        const actualMonth = month % 12;

        const monthKey = `${actualYear}-${String(actualMonth + 1).padStart(2, '0')}`;
        const monthDates = get().datesByMonth[monthKey] || [];
        dates.push(...monthDates);
      }

      return dates;
    },

    // Добавить следующие 3 месяца к уже загруженным
    loadNext3Months: async () => {
      const { loadedDates, isLoadingMore, canLoadMore } = get();

      if (isLoadingMore || !canLoadMore) return;

      set({ isLoadingMore: true, loadingProgress: 0 });

      // Симулируем задержку загрузки для UX
      await new Promise(resolve => setTimeout(resolve, 500));

      // Получаем последнюю загруженную дату
      const lastDate = loadedDates[loadedDates.length - 1];
      if (!lastDate) {
        set({ isLoadingMore: false });
        return;
      }

      const lastDateObj = new Date(lastDate);
      // Переходим к следующему месяцу
      lastDateObj.setMonth(lastDateObj.getMonth() + 1);
      lastDateObj.setDate(1);

      // Загружаем следующие 3 месяца
      const next3Months = get().getNext3MonthsFrom(lastDateObj, lastDateObj.getFullYear());

      if (next3Months.length === 0) {
        set({ canLoadMore: false, isLoadingMore: false });
        return;
      }

      // Обновляем загруженные даты
      const newLoadedDates = [...loadedDates, ...next3Months];

      // Обновляем visibleSlots
      const newVisibleSlots = Array.from({ length: newLoadedDates.length }, (_, i) => i);

      // Обновляем mapping
      const newSlotToDate = {};
      newLoadedDates.forEach((date, index) => {
        newSlotToDate[index] = date;
      });

      // Пересчитываем группы месяцев
      const groups = get().calculateMonthGroups(newLoadedDates);

      // Проверяем, можем ли загрузить еще
      const lastLoadedDate = new Date(newLoadedDates[newLoadedDates.length - 1]);
      const maxYear = Math.max(...Object.keys(get().datesByYear).map(y => parseInt(y)));
      const canContinue = lastLoadedDate.getFullYear() < maxYear ||
                          (lastLoadedDate.getFullYear() === maxYear && lastLoadedDate.getMonth() < 11);

      set({
        loadedDates: newLoadedDates,
        visibleSlots: newVisibleSlots,
        slotToDate: newSlotToDate,
        monthGroups: groups,
        isLoadingMore: false,
        loadingProgress: 100,
        canLoadMore: canContinue
      });

      // Сбрасываем прогресс через небольшую задержку
      setTimeout(() => {
        set({ loadingProgress: 0 });
      }, 300);
    },

    // Установить прогресс загрузки (вызывается из хука infinite scroll)
    setLoadingProgress: (progress) => {
      set({ loadingProgress: Math.min(100, Math.max(0, progress)) });
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