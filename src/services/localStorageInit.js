/**
 * localStorageInit.js - Инициализация localStorage данными из JSON файлов
 *
 * При первом запуске приложения копирует данные из /public/*.json
 * в localStorage для имитации backend API.
 *
 * Данные хранятся в НОРМАЛИЗОВАННОМ виде с версионированием:
 * - schedule-{dept}-{year}       → { scheduleMap, version }
 * - draft-schedule-{dept}-{year} → { scheduleMap, baseVersion, changedCells }
 * - employees-{dept}             → { employeeById, employeeIds }
 * - draft-employees-{dept}       → { employeeById, employeeIds } черновика
 *
 * Версионирование позволяет определить:
 * - baseVersion === version → черновик синхронизирован с продом
 * - baseVersion !== version → черновик устарел, нужна полная публикация
 */

const INIT_FLAG_KEY = 'grafic-app-initialized';
const STORAGE_VERSION = '3.0'; // Версия увеличена: добавлено версионирование расписаний

/**
 * Конфигурация данных для загрузки
 */
const DATA_FILES = [
  { dept: 'dept-1', year: 2025 },
  { dept: 'dept-1', year: 2026 },
  { dept: 'dept-4', year: 2025 }
];

/**
 * Ключи для хранения в localStorage
 */
export const STORAGE_KEYS = {
  // Расписание (scheduleMap)
  schedule: (deptId, year) => `schedule-${deptId}-${year}`,

  // Черновик расписания (scheduleMap)
  draftSchedule: (deptId, year) => `draft-schedule-${deptId}-${year}`,

  // Список сотрудников отдела { employeeById, employeeIds }
  employees: (deptId) => `employees-${deptId}`,

  // Черновик сотрудников { employeeById, employeeIds }
  draftEmployees: (deptId) => `draft-employees-${deptId}`,

  // Доступные года для отдела
  availableYears: (deptId) => `available-years-${deptId}`,

  // Версии года (для истории)
  versions: (deptId, year) => `versions-${deptId}-${year}`,

  // Устаревший ключ (для миграции)
  // @deprecated используйте draftSchedule
  draft: (deptId, year) => `draft-${deptId}-${year}`
};

/**
 * Проверить, инициализирован ли localStorage
 */
export const isInitialized = () => {
  const flag = localStorage.getItem(INIT_FLAG_KEY);
  return flag === STORAGE_VERSION;
};

/**
 * Загрузить данные из JSON файла
 */
const fetchJsonFile = async (deptId, year) => {
  try {
    const url = `/data-${deptId}-${year}.json`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to load ${deptId}/${year}:`, error);
    return null;
  }
};

/**
 * Нормализовать данные из JSON формата
 * @param {Object} rawData - сырые данные из JSON { data: [...] }
 * @param {number} year - год для формирования дат
 * @returns {{ scheduleMap, employeeById, employeeIds }}
 */
const normalizeRawData = (rawData, year) => {
  const employeeById = {};
  const employeeIds = [];
  const scheduleMap = {};

  rawData.data.forEach(employee => {
    const employeeId = String(employee.id);

    employeeIds.push(employeeId);

    employeeById[employeeId] = {
      id: employeeId,
      name: `${employee.fio.family} ${employee.fio.name1[0]}.${employee.fio.name2[0]}.`,
      fullName: `${employee.fio.family} ${employee.fio.name1} ${employee.fio.name2}`,
      position: employee.position || ''
    };

    Object.entries(employee.schedule).forEach(([dateKey, status]) => {
      // dateKey приходит как "01-01", преобразуем в "2025-01-01"
      const fullDate = `${year}-${dateKey}`;
      const key = `${employeeId}-${fullDate}`;
      scheduleMap[key] = status;
    });
  });

  return { scheduleMap, employeeById, employeeIds };
};

/**
 * Сохранить нормализованное расписание в localStorage
 * Включает version для отслеживания изменений
 */
const saveScheduleToStorage = (deptId, year, scheduleMap) => {
  const key = STORAGE_KEYS.schedule(deptId, year);
  const data = {
    scheduleMap,
    version: Date.now()  // timestamp публикации
  };
  localStorage.setItem(key, JSON.stringify(data));
  console.log(`✅ Saved ${key} (${Object.keys(scheduleMap).length} cells, v${data.version})`);
};

/**
 * Сохранить список сотрудников отдела
 */
const saveEmployeesToStorage = (deptId, employeeById, employeeIds) => {
  const key = STORAGE_KEYS.employees(deptId);
  localStorage.setItem(key, JSON.stringify({ employeeById, employeeIds }));
  console.log(`✅ Saved employees for ${deptId}: ${employeeIds.length} employees`);
};

/**
 * Обновить список доступных годов для отдела
 */
const updateAvailableYears = (deptId, year) => {
  const key = STORAGE_KEYS.availableYears(deptId);
  const stored = localStorage.getItem(key);
  const years = stored ? JSON.parse(stored) : [];

  const yearStr = String(year);
  if (!years.includes(yearStr)) {
    years.push(yearStr);
    years.sort();
    localStorage.setItem(key, JSON.stringify(years));
  }
};

/**
 * Инициализировать localStorage данными из JSON файлов
 */
export const initializeLocalStorage = async () => {
  console.log('📦 Инициализация localStorage (v2 - normalized)...');

  let successCount = 0;
  let failCount = 0;

  // Отслеживаем какие отделы уже инициализированы (для сотрудников)
  const initializedDepts = new Set();

  // Загружаем все файлы
  for (const { dept, year } of DATA_FILES) {
    const rawData = await fetchJsonFile(dept, year);

    if (rawData) {
      // Нормализуем данные сразу
      const { scheduleMap, employeeById, employeeIds } = normalizeRawData(rawData, year);

      // Сохраняем нормализованное расписание
      saveScheduleToStorage(dept, year, scheduleMap);

      // Сохраняем список сотрудников (только один раз на отдел)
      if (!initializedDepts.has(dept)) {
        saveEmployeesToStorage(dept, employeeById, employeeIds);
        initializedDepts.add(dept);
      }

      // Обновляем список доступных годов
      updateAvailableYears(dept, year);

      successCount++;
    } else {
      failCount++;
    }
  }

  // Устанавливаем флаг инициализации
  localStorage.setItem(INIT_FLAG_KEY, STORAGE_VERSION);

  console.log(`✅ localStorage инициализирован: ${successCount} успешно, ${failCount} ошибок`);
  console.log(`📊 Всего ключей: ${Object.keys(localStorage).length}`);
};

/**
 * Очистить все данные приложения из localStorage
 */
export const clearAppStorage = () => {
  const keys = Object.keys(localStorage);
  let cleared = 0;

  keys.forEach(key => {
    if (key.startsWith('schedule-') ||
        key.startsWith('draft-schedule-') ||
        key.startsWith('draft-') ||  // старый формат
        key.startsWith('employees-') ||
        key.startsWith('draft-employees-') ||
        key.startsWith('available-years-') ||
        key.startsWith('versions-') ||
        key === INIT_FLAG_KEY) {
      localStorage.removeItem(key);
      cleared++;
    }
  });

  console.log(`🗑️ Очищено ${cleared} ключей из localStorage`);
};

/**
 * Получить информацию о хранилище
 */
export const getStorageInfo = () => {
  const keys = Object.keys(localStorage);
  const appKeys = keys.filter(k =>
    k.startsWith('schedule-') ||
    k.startsWith('draft-schedule-') ||
    k.startsWith('draft-') ||
    k.startsWith('employees-') ||
    k.startsWith('draft-employees-') ||
    k.startsWith('available-years-') ||
    k.startsWith('versions-')
  );

  let totalSize = 0;
  appKeys.forEach(key => {
    const value = localStorage.getItem(key);
    totalSize += (key.length + (value?.length || 0)) * 2; // Примерно в байтах (UTF-16)
  });

  return {
    initialized: isInitialized(),
    totalKeys: appKeys.length,
    sizeKB: (totalSize / 1024).toFixed(2),
    schedules: appKeys.filter(k => k.startsWith('schedule-') && !k.startsWith('draft-schedule-')).length,
    draftSchedules: appKeys.filter(k => k.startsWith('draft-schedule-')).length,
    employees: appKeys.filter(k => k.startsWith('employees-') && !k.startsWith('draft-employees-')).length,
    draftEmployees: appKeys.filter(k => k.startsWith('draft-employees-')).length
  };
};
