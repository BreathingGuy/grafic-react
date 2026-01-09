import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MONTHS } from '../constants/index';

// ======================================================
// 📅 ГЕНЕРАЦИЯ СТАТИЧНОГО ИНДЕКСА ДАТ (один раз при загрузке модуля)
// ======================================================

const generateDateIndex = (startYear, endYear) => {
  const datesByYear = {};
  const datesByMonth = {};
  const datesByQuarter = {};  // ← Индекс по кварталам
  const dateDays = {};        // ← Число дня (для быстрого доступа)
  const allDates = [];

  for (let year = startYear; year <= endYear; year++) {
    datesByYear[year] = [];

    // Инициализируем кварталы
    for (let q = 0; q < 4; q++) {
      const quarterKey = `${year}-Q${q + 1}`;
      datesByQuarter[quarterKey] = [];
    }

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      datesByMonth[monthKey] = [];

      // Определяем квартал (0-3)
      const quarter = Math.floor(month / 3);
      const quarterKey = `${year}-Q${quarter + 1}`;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        allDates.push(dateStr);
        datesByYear[year].push(dateStr);
        datesByMonth[monthKey].push(dateStr);
        datesByQuarter[quarterKey].push(dateStr);  // ← Добавляем в квартал

        // Сохраняем только число дня (для заголовков)
        dateDays[dateStr] = day;  // "2025-01-15" → 15
      }
    }
  }

  return { allDates, datesByYear, datesByMonth, datesByQuarter, dateDays };
};

// Генерируем год для добавления в существующий индекс
const generateYearData = (year) => {
  const datesByYear = [];
  const datesByMonth = {};
  const datesByQuarter = {};
  const dateDays = {};

  // Инициализируем кварталы
  for (let q = 0; q < 4; q++) {
    const quarterKey = `${year}-Q${q + 1}`;
    datesByQuarter[quarterKey] = [];
  }

  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    datesByMonth[monthKey] = [];

    const quarter = Math.floor(month / 3);
    const quarterKey = `${year}-Q${quarter + 1}`;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      datesByYear.push(dateStr);
      datesByMonth[monthKey].push(dateStr);
      datesByQuarter[quarterKey].push(dateStr);
      dateDays[dateStr] = day;
    }
  }

  return { datesByYear, datesByMonth, datesByQuarter, dateDays };
};

// Генерируем индекс для диапазона 2024-2026 (один раз!)
const startYear = 2025;
const DATE_INDEX = generateDateIndex(2025, startYear + 1);

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
    datesByQuarter: DATE_INDEX.datesByQuarter,  // ← Квартальный индекс
    dateDays: DATE_INDEX.dateDays,              // ← Быстрый доступ к дню месяца

    // Границы навигации
    minYear: startYear,
    maxYear: startYear + 1,

    // Текущее состояние навигации
    currentYear: new Date().getFullYear(),
    period: '3months',                      // По умолчанию 3 месяца
    periods: ['3months', '1month', '7days'],
    baseDate: new Date(),                   // Базовая дата для расчета диапазона

    // Режим админа — без ограничений навигации
    isAdminMode: false,

    // 🎯 СИСТЕМА СЛОТОВ - ключевая оптимизация!
    // visibleSlots - ФИКСИРОВАННЫЙ массив индексов (НИКОГДА НЕ МЕНЯЕТСЯ!)
    // При навигации меняется только slotToDate/slotToDay mapping
    visibleSlots: Array.from({ length: 366 }, (_, i) => i),  // [0, 1, 2, ..., 365] - максимум для года
    slotToDate: {},                         // { 0: "2025-01-01", 1: "2025-01-02", ... }
    slotToDay: {},                          // { 0: 1, 1: 2, 2: 3, ... } - только числа для заголовков

    // Для заголовков таблицы
    monthGroups: [],

    // === HELPER ФУНКЦИИ ===

    // Обновить слоты и маппинги (избегаем дублирования кода)
    updateSlots: (dates) => {
      const { dateDays } = get();

      const slotToDate = {};
      const slotToDay = {};

      dates.forEach((date, index) => {
        slotToDate[index] = date;
        slotToDay[index] = dateDays[date];  // Быстрый доступ к числу дня
      });

      const monthGroups = get().calculateMonthGroups(dates);

      set({
        slotToDate,
        slotToDay,
        monthGroups
      });

      console.log(slotToDate);
      console.log(slotToDay);

      console.log(get().datesByYear);
      console.log(get().datesByQuarter);
      
      
    },

    // === ИНИЦИАЛИЗАЦИЯ ===

    initialize: () => {
      const { period, baseDate, currentYear } = get();
      const dates = get().calculateVisibleDates(period, baseDate, currentYear);
      get().updateSlots(dates);
    },

    // === ВЫЧИСЛЕНИЕ ВИДИМЫХ ДАТ ===

    calculateVisibleDates: (period, baseDate, year) => {
      const { datesByYear, datesByMonth, datesByQuarter } = get();

      if (period === '1year') {
        // ✅ O(1) - просто возвращаем готовый массив
        return datesByYear[year] || [];
      }

      if (period === '3months') {
        // ✅ O(1) - получаем квартал из индекса
        const quarter = Math.floor(baseDate.getMonth() / 3) + 1;
        const quarterKey = `${year}-Q${quarter}`;
        return datesByQuarter[quarterKey] || [];
      }

      if (period === '1month') {
        // ✅ O(1) - получаем месяц из индекса
        const month = baseDate.getMonth();
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        return datesByMonth[monthKey] || [];
      }

      if (period === '7days') {
        // Генерируем неделю (пока нет индекса)
        return get().getWeekDates(baseDate);
      }

      return [];
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

    // === ПРОВЕРКИ ГРАНИЦ НАВИГАЦИИ ===

    // Можно ли идти вперед?
    canGoNext: () => {
      const { period, baseDate, currentYear, maxYear, isAdminMode } = get();

      // Админ может идти куда угодно
      if (isAdminMode) return true;

      if (period === '1year') {
        return currentYear < maxYear;
      }

      if (period === '3months') {
        const quarter = Math.floor(baseDate.getMonth() / 3);
        // Последний квартал последнего года?
        return !(currentYear === maxYear && quarter === 3);
      }

      if (period === '1month') {
        const month = baseDate.getMonth();
        // Последний месяц последнего года?
        return !(currentYear === maxYear && month === 11);
      }

      if (period === '7days') {
        // Проверяем, не выйдет ли неделя за пределы maxYear
        const newDate = new Date(baseDate);
        newDate.setDate(newDate.getDate() + 7);
        return newDate.getFullYear() <= maxYear;
      }

      return false;
    },

    // Можно ли идти назад?
    canGoPrev: () => {
      const { period, baseDate, currentYear, minYear, isAdminMode } = get();

      // Админ может идти куда угодно
      if (isAdminMode) return true;

      if (period === '1year') {
        return currentYear > minYear;
      }

      if (period === '3months') {
        const quarter = Math.floor(baseDate.getMonth() / 3);
        // Первый квартал первого года?
        return !(currentYear === minYear && quarter === 0);
      }

      if (period === '1month') {
        const month = baseDate.getMonth();
        // Первый месяц первого года?
        return !(currentYear === minYear && month === 0);
      }

      if (period === '7days') {
        // Проверяем, не выйдет ли неделя за пределы minYear
        const newDate = new Date(baseDate);
        newDate.setDate(newDate.getDate() - 7);
        return newDate.getFullYear() >= minYear;
      }

      return false;
    },

    // Установить режим админа
    setAdminMode: (isAdmin) => {
      set({ isAdminMode: isAdmin });
    },

    // === ACTIONS ===

    // Установить период
    setPeriod: (newPeriod) => {
      const { baseDate, currentYear } = get();
      set({ period: newPeriod });

      const dates = get().calculateVisibleDates(newPeriod, baseDate, currentYear);
      get().updateSlots(dates);
    },

    // Навигация (вперед/назад) - КЛЮЧЕВОЙ МЕТОД!
    // Меняется только slotToDate/slotToDay, visibleSlots остается [0,1,2,...365]
    shiftDates: (direction) => {
      // Проверка границ
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

      set({
        baseDate: newDate,
        currentYear: newYear
      });

      const dates = get().calculateVisibleDates(period, newDate, newYear);
      get().updateSlots(dates);
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

      const dates = get().calculateVisibleDates(period, newDate, newYear);
      get().updateSlots(dates);
    },

    // Переход на конкретный год
    setYear: (year) => {
      const { minYear, maxYear, isAdminMode } = get();

      // Если не админ — проверка границ
      if (!isAdminMode && (year < minYear || year > maxYear)) {
        console.log(`⚠️ Год ${year} за пределами допустимого диапазона (${minYear}-${maxYear})`);
        return;
      }

      // Если админ и год за пределами — расширяем индекс
      if (isAdminMode) {
        get().ensureYearExists(year);
      }

      const newBaseDate = new Date(year, 0, 1); // 1 января

      set({
        currentYear: year,
        baseDate: newBaseDate
      });

      const { period } = get();
      const dates = get().calculateVisibleDates(period, newBaseDate, year);
      get().updateSlots(dates);
    },

    // Расширить индекс дат, если год ещё не существует (для админа)
    ensureYearExists: (year) => {
      const { datesByYear, datesByMonth, datesByQuarter, dateDays, allDates, minYear, maxYear } = get();

      // Уже существует?
      if (datesByYear[year]) {
        return;
      }

      console.log(`📆 Расширяем индекс дат для года ${year}`);

      // Генерируем данные для нового года
      const yearData = generateYearData(year);

      // Объединяем с существующими данными
      const newDatesByYear = { ...datesByYear, [year]: yearData.datesByYear };
      const newDatesByMonth = { ...datesByMonth, ...yearData.datesByMonth };
      const newDatesByQuarter = { ...datesByQuarter, ...yearData.datesByQuarter };
      const newDateDays = { ...dateDays, ...yearData.dateDays };
      const newAllDates = [...allDates, ...yearData.datesByYear].sort();

      // Обновляем границы
      const newMinYear = Math.min(minYear, year);
      const newMaxYear = Math.max(maxYear, year);

      set({
        datesByYear: newDatesByYear,
        datesByMonth: newDatesByMonth,
        datesByQuarter: newDatesByQuarter,
        dateDays: newDateDays,
        allDates: newAllDates,
        minYear: newMinYear,
        maxYear: newMaxYear
      });

      console.log(`✅ Год ${year} добавлен. Диапазон: ${newMinYear}-${newMaxYear}`);
    },

    // Сброс к текущему году
    resetToCurrentYear: () => {
      const currentYear = new Date().getFullYear();
      const newBaseDate = new Date();

      set({
        currentYear,
        baseDate: newBaseDate
      });

      const { period } = get();
      const dates = get().calculateVisibleDates(period, newBaseDate, currentYear);
      get().updateSlots(dates);
    },

    // Получить текущий год (для загрузки данных)
    getCurrentYear: () => {
      return get().currentYear;
    }

  }), { name: 'DateStore' })
);

export default useDateStore;