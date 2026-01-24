/**
 * localStorageInit.js - Инициализация localStorage данными из JSON файлов
 *
 * При первом запуске приложения копирует данные из /public/*.json
 * в localStorage для имитации backend API.
 */

const INIT_FLAG_KEY = 'grafic-app-initialized';
const STORAGE_VERSION = '1.0';

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
  // Данные расписаний
  schedule: (deptId, year) => `schedule-${deptId}-${year}`,

  // Черновики (drafts)
  draft: (deptId, year) => `draft-${deptId}-${year}`,

  // Список сотрудников отдела
  employees: (deptId) => `employees-${deptId}`,

  // Черновик списка сотрудников (для админа)
  draftEmployees: (deptId) => `draft-employees-${deptId}`,

  // Доступные года для отдела
  availableYears: (deptId) => `available-years-${deptId}`,

  // Версии года (для истории)
  versions: (deptId, year) => `versions-${deptId}-${year}`
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
 * Нормализовать данные расписания из формата JSON в формат приложения
 */
const normalizeScheduleData = (rawData, year) => {
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

  return { employeeById, employeeIds, scheduleMap };
};

/**
 * Сохранить данные расписания в localStorage
 * Сохраняется ТОЛЬКО график (scheduleMap), без данных о сотрудниках
 */
const saveScheduleToStorage = (deptId, year, rawData) => {
  const key = STORAGE_KEYS.schedule(deptId, year);

  // Нормализуем данные и извлекаем только scheduleMap
  const { scheduleMap } = normalizeScheduleData(rawData, year);

  localStorage.setItem(key, JSON.stringify({ scheduleMap }));
  console.log(`✅ Saved ${key} (${Object.keys(scheduleMap).length} cells)`);
};

/**
 * Сохранить список сотрудников отдела
 */
const saveEmployeesToStorage = (deptId, rawData) => {
  const key = STORAGE_KEYS.employees(deptId);

  // Извлекаем только информацию о сотрудниках
  const employeeById = {};
  const employeeIds = [];

  rawData.data.forEach(employee => {
    const employeeId = String(employee.id);
    employeeIds.push(employeeId);

    employeeById[employeeId] = {
      id: employeeId,
      name: `${employee.fio.family} ${employee.fio.name1[0]}.${employee.fio.name2[0]}.`,
      fullName: `${employee.fio.family} ${employee.fio.name1} ${employee.fio.name2}`,
      position: employee.position || ''
    };
  });

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
  console.log('📦 Инициализация localStorage...');

  let successCount = 0;
  let failCount = 0;

  // Загружаем все файлы
  for (const { dept, year } of DATA_FILES) {
    const rawData = await fetchJsonFile(dept, year);

    if (rawData) {
      // Сохраняем расписание
      saveScheduleToStorage(dept, year, rawData);

      // Сохраняем список сотрудников (только один раз на отдел)
      const employeesKey = STORAGE_KEYS.employees(dept);
      if (!localStorage.getItem(employeesKey)) {
        saveEmployeesToStorage(dept, rawData);
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
        key.startsWith('draft-') ||
        key.startsWith('employees-') ||
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
    k.startsWith('draft-') ||
    k.startsWith('employees-') ||
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
    schedules: appKeys.filter(k => k.startsWith('schedule-')).length,
    drafts: appKeys.filter(k => k.startsWith('draft-')).length,
    employees: appKeys.filter(k => k.startsWith('employees-')).length
  };
};
