import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  VISIBLE_SLOTS,
  createSlotMapping,
  calculateMonthGroups,
  getYearDates,
  getYearDatesWithOffset
} from '../utils/dateIndex';

/**
 * dateAdminStore — управление датами для Admin View
 *
 * Всегда показывает год целиком.
 * Поддерживает сдвинутую таблицу (offset) для отображения
 * кварталов один над другим.
 */
export const useDateAdminStore = create(devtools((set, get) => ({
    // === STATE ===

    currentYear: new Date().getFullYear(),

    // Основная таблица (год)
    visibleSlots: VISIBLE_SLOTS,
    slotToDate: {},
    slotToDay: {},
    monthGroups: [],

    // Сдвинутая таблица (год со сдвигом на 3 месяца)
    // Используется для отображения кварталов один над другим
    offsetSlotToDate: {},
    offsetSlotToDay: {},
    offsetMonthGroups: [],
    offsetMonths: 3,  // Сдвиг в месяцах

    // === ИНИЦИАЛИЗАЦИЯ ===

    /**
     * Инициализировать слоты для года
     * @param {number} year
     */
    initializeYear: (year) => {
      console.log(`📅 [Admin] Инициализация слотов для ${year} года`);

      // Основная таблица
      const dates = getYearDates(year);
      const { slotToDate, slotToDay } = createSlotMapping(dates);
      const monthGroups = calculateMonthGroups(dates);

      // Сдвинутая таблица
      const { offsetMonths } = get();
      const offsetDates = getYearDatesWithOffset(year, offsetMonths);
      const offsetMapping = createSlotMapping(offsetDates);
      const offsetMonthGroups = calculateMonthGroups(offsetDates);

      set({
        currentYear: year,
        slotToDate,
        slotToDay,
        monthGroups,
        offsetSlotToDate: offsetMapping.slotToDate,
        offsetSlotToDay: offsetMapping.slotToDay,
        offsetMonthGroups
      });

      console.log(`✅ [Admin] Слоты инициализированы: ${dates.length} дней, год ${year}`);
      console.log(`✅ [Admin] Слоты инициализированы: ${dates.length} дней, ${dates}`);
    },

    // === ACTIONS ===

    /**
     * Переключить на другой год
     */
    setYear: (year) => {
      get().initializeYear(year);
    },

    /**
     * Навигация по годам
     */
    goToNextYear: () => {
      const { currentYear } = get();
      get().initializeYear(currentYear + 1);
    },

    goToPrevYear: () => {
      const { currentYear } = get();
      get().initializeYear(currentYear - 1);
    },

    /**
     * Установить сдвиг для второй таблицы
     * @param {number} months - количество месяцев сдвига
     */
    setOffsetMonths: (months) => {
      const { currentYear } = get();
      set({ offsetMonths: months });

      // Пересчитываем сдвинутую таблицу
      const offsetDates = getYearDatesWithOffset(currentYear, months);
      const offsetMapping = createSlotMapping(offsetDates);
      const offsetMonthGroups = calculateMonthGroups(offsetDates);

      set({
        offsetSlotToDate: offsetMapping.slotToDate,
        offsetSlotToDay: offsetMapping.slotToDay,
        offsetMonthGroups
      });
    },

    /**
     * Сбросить к текущему году
     */
    reset: () => {
      const currentYear = new Date().getFullYear();
      get().initializeYear(currentYear);
    }

}), { name: 'DateAdminStore' }));

export default useDateAdminStore;
