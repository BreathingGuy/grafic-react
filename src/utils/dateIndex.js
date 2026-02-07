import { MONTHS } from '../constants/index';

/**
 * dateIndex.js — динамические функции для работы с датами
 *
 * Генерация дат происходит динамически по запросу,
 * без жестко заданных ограничений по годам.
 */

// ======================================================
// КЭШИРОВАНИЕ СГЕНЕРИРОВАННЫХ ДАТ
// ======================================================

// Кэш для хранения уже сгенерированных годов (для производительности)
const dateCache = {
  datesByYear: {},
  datesByMonth: {},
  datesByQuarter: {},
  dateDays: {}
};

/**
 * Генерировать даты для конкретного года
 * @param {number} year
 */
const generateYearDates = (year) => {
  // Проверяем кэш
  if (dateCache.datesByYear[year]) {
    return;
  }

  dateCache.datesByYear[year] = [];

  // Инициализируем кварталы
  for (let q = 0; q < 4; q++) {
    const quarterKey = `${year}-Q${q + 1}`;
    dateCache.datesByQuarter[quarterKey] = [];
  }

  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    dateCache.datesByMonth[monthKey] = [];

    // Определяем квартал (0-3)
    const quarter = Math.floor(month / 3);
    const quarterKey = `${year}-Q${quarter + 1}`;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      dateCache.datesByYear[year].push(dateStr);
      dateCache.datesByMonth[monthKey].push(dateStr);
      dateCache.datesByQuarter[quarterKey].push(dateStr);

      // Сохраняем только число дня (для заголовков)
      dateCache.dateDays[dateStr] = day;
    }
  }
};

// ======================================================
// HELPER ФУНКЦИИ
// ======================================================

/**
 * Создать маппинг слотов для массива дат
 * @param {string[]} dates - массив дат
 * @returns {{ slotToDate: Object, slotToDay: Object }}
 */
export const createSlotMapping = (dates) => {
  const slotToDate = {};
  const slotToDay = {};

  dates.forEach((date, index) => {
    slotToDate[index] = date;
    // Извлекаем день из даты (формат YYYY-MM-DD)
    slotToDay[index] = parseInt(date.split('-')[2], 10);
  });

  return { slotToDate, slotToDay };
};

/**
 * Вычислить группировку по месяцам для заголовков
 * @param {string[]} dates - массив дат
 * @returns {Array<{month: string, colspan: number}>}
 */
export const calculateMonthGroups = (dates) => {
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
};

/**
 * Получить даты года
 * @param {number} year
 * @returns {string[]}
 */
export const getYearDates = (year) => {
  // Генерируем год если его нет в кэше
  generateYearDates(year);
  return dateCache.datesByYear[year] || [];
};

/**
 * Получить даты квартала
 * @param {number} year
 * @param {number} quarter - 1-4
 * @returns {string[]}
 */
export const getQuarterDates = (year, quarter) => {
  // Генерируем год если его нет в кэше
  generateYearDates(year);
  const quarterKey = `${year}-Q${quarter}`;
  return dateCache.datesByQuarter[quarterKey] || [];
};

/**
 * Получить даты месяца
 * @param {number} year
 * @param {number} month - 0-11
 * @returns {string[]}
 */
export const getMonthDates = (year, month) => {
  // Генерируем год если его нет в кэше
  generateYearDates(year);
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  return dateCache.datesByMonth[monthKey] || [];
};

/**
 * Получить даты недели (с понедельника по воскресенье)
 * @param {Date} baseDate
 * @returns {string[]}
 */
export const getWeekDates = (baseDate) => {
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
};

/**
 * Получить даты года со сдвигом на N месяцев вперёд
 * (для админской таблицы со сдвинутыми кварталами)
 * @param {number} year
 * @param {number} offsetMonths - сдвиг вперёд в месяцах (например, 3 = начать с апреля)
 * @returns {string[]}
 */
export const getYearDatesWithOffset = (year, offsetMonths) => {
  const dates = [];

  // Начинаем с offsetMonths текущего года (3 = апрель, индекс 0-11)
  let currentYear = year;
  let currentMonth = offsetMonths;
  let daysCollected = 0;

  // Собираем 365/366 дней
  const targetDays = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;

  // Предварительно генерируем нужные года
  generateYearDates(year);
  if (offsetMonths > 0) {
    generateYearDates(year + 1); // Может понадобиться следующий год
  }

  // Защита от бесконечного цикла - максимум 24 месяца (2 года)
  let iterations = 0;
  const maxIterations = 24;

  while (daysCollected < targetDays && iterations < maxIterations) {
    // Генерируем год если его нет
    generateYearDates(currentYear);

    const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthDates = dateCache.datesByMonth[monthKey] || [];

    // Если нет данных для месяца (не должно происходить с динамической генерацией)
    if (monthDates.length === 0) {
      console.warn(`⚠️ Нет данных для ${monthKey}, собрано ${daysCollected} дней`);
      break;
    }

    monthDates.forEach(date => {
      if (daysCollected < targetDays) {
        dates.push(date);
        daysCollected++;
      }
    });

    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    iterations++;
  }

  return dates;
};

// Максимальное количество слотов (для года)
export const MAX_SLOTS = 366;

// Фиксированный массив индексов слотов
export const VISIBLE_SLOTS = Array.from({ length: MAX_SLOTS }, (_, i) => i);

// ======================================================
// УПРАВЛЕНИЕ КЭШЕМ
// ======================================================

/**
 * Предзагрузить диапазон годов в кэш (для производительности)
 * @param {number} startYear
 * @param {number} endYear
 */
export const preloadYears = (startYear, endYear) => {
  for (let year = startYear; year <= endYear; year++) {
    generateYearDates(year);
  }
  console.log(`📅 Предзагружены года: ${startYear}-${endYear}`);
};

/**
 * Очистить кэш дат (если нужна экономия памяти)
 */
export const clearDateCache = () => {
  dateCache.datesByYear = {};
  dateCache.datesByMonth = {};
  dateCache.datesByQuarter = {};
  dateCache.dateDays = {};
  console.log('🗑️ Кэш дат очищен');
};

/**
 * Получить информацию о кэше
 */
export const getCacheInfo = () => {
  const years = Object.keys(dateCache.datesByYear).sort();
  return {
    cachedYears: years,
    yearCount: years.length,
    totalDates: Object.keys(dateCache.dateDays).length
  };
};

// Предзагружаем текущий год и несколько лет вперёд при инициализации
const currentYear = new Date().getFullYear();
preloadYears(currentYear, currentYear + 5);
