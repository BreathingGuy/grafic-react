import { create } from 'zustand';
import { STORAGE_KEYS } from '../services/localStorageInit';

/**
 * fetchWebStore — чтение данных из localStorage (имитация GET запросов)
 *
 * Все данные хранятся в НОРМАЛИЗОВАННОМ виде с версионированием:
 * - schedule-{dept}-{year}       → { scheduleMap, version }
 * - draft-schedule-{dept}-{year} → { scheduleMap, baseVersion, changedCells }
 * - employees-{dept}             → { employeeById, employeeIds }
 */
export const useFetchWebStore = create((set, get) => ({
    // === STATE ===
    loading: {
      schedule: false,
      scheduleDraft: false,
      departmentsList: false,
      departmentConfig: false,
      departmentYears: false,
      yearVersions: false,
      versionSchedule: false,
      publish: false
    },
    errors: {
      schedule: null,
      scheduleDraft: null,
      departmentsList: null,
      departmentConfig: null,
      departmentYears: null,
      yearVersions: null,
      versionSchedule: null,
      publish: null
    },

    // === LOADING HELPERS ===
    setLoading: (key, value) => {
      set(state => ({
        loading: { ...state.loading, [key]: value }
      }));
    },

    setError: (key, error) => {
      set(state => ({
        errors: { ...state.errors, [key]: error }
      }));
    },

    clearError: (key) => {
      set(state => ({
        errors: { ...state.errors, [key]: null }
      }));
    },

    // === SCHEDULE API ===

    /**
     * Загрузить расписание для отдела и года
     * @param {string} departmentId - ID отдела
     * @param {number} year - год
     * @param {Object} options - опции
     * @param {string} options.mode - 'production' (по умолчанию) или 'draft'
     * @returns {{ scheduleMap, version?, baseVersion?, changedCells? }}
     */
    fetchSchedule: async (departmentId, year, options = {}) => {
      const { mode = 'production' } = options;

      // Валидация параметров
      if (!departmentId) {
        throw new Error('fetchSchedule: departmentId is required');
      }
      if (!year) {
        throw new Error('fetchSchedule: year is required');
      }

      const loadingKey = mode === 'draft' ? 'scheduleDraft' : 'schedule';
      get().setLoading(loadingKey, true);
      get().clearError(loadingKey);

      try {
        console.log(`📥 fetchSchedule [${mode}]: ${departmentId}/${year}`);

        // Имитация задержки сети
        await new Promise(resolve => setTimeout(resolve, 100));

        let stored;
        let isDraftFallback = false;

        if (mode === 'draft') {
          // Сначала пытаемся загрузить draft
          const draftKey = STORAGE_KEYS.draftSchedule(departmentId, year);
          stored = localStorage.getItem(draftKey);

          // Если draft не найден - fallback на production
          if (!stored) {
            console.log(`📋 Draft не найден, загружаем production как fallback`);
            const prodKey = STORAGE_KEYS.schedule(departmentId, year);
            stored = localStorage.getItem(prodKey);
            isDraftFallback = true;
          }
        } else {
          // Production mode - загружаем только production
          const key = STORAGE_KEYS.schedule(departmentId, year);
          stored = localStorage.getItem(key);
        }

        if (!stored) {
          throw new Error(`Расписание ${departmentId}/${year} не найдено в localStorage`);
        }

        const data = JSON.parse(stored);

        get().setLoading(loadingKey, false);

        // Поддержка старого формата (просто scheduleMap) и нового ({ scheduleMap, version })
        if (data.scheduleMap) {
          // Новый формат с версионированием
          if (mode === 'draft' && !isDraftFallback) {
            // Возвращаем draft данные
            return {
              scheduleMap: data.scheduleMap,
              baseVersion: data.baseVersion || null,
              changedCells: data.changedCells || {}
            };
          } else {
            // Возвращаем production данные
            return {
              scheduleMap: data.scheduleMap,
              version: data.version || null
            };
          }
        } else {
          // Старый формат - просто scheduleMap
          return { scheduleMap: data, version: null };
        }

      } catch (error) {
        console.error(`fetchSchedule [${mode}] error:`, error);
        get().setError(loadingKey, error.message);
        get().setLoading(loadingKey, false);
        throw error;
      }
    },

    /**
     * Получить версию production расписания (без загрузки всех данных)
     * @param {string} departmentId
     * @param {number} year
     * @returns {{ version: number | null }}
     */
    fetchScheduleVersion: async (departmentId, year) => {
      try {
        const key = STORAGE_KEYS.schedule(departmentId, year);
        const stored = localStorage.getItem(key);

        if (!stored) {
          return { version: null };
        }

        const data = JSON.parse(stored);
        return { version: data.version || null };

      } catch (error) {
        console.error('fetchScheduleVersion error:', error);
        return { version: null };
      }
    },

    // === DEPARTMENTS API ===

    /**
     * Загрузить список отделов
     * Проверяет localStorage (редактированные данные), затем JSON-файл
     * @returns {{ departments: Array }}
     */
    fetchDepartmentsList: async () => {
      get().setLoading('departmentsList', true);
      get().clearError('departmentsList');

      try {
        // Сначала проверяем localStorage
        const lsKey = STORAGE_KEYS.departmentList();
        const stored = localStorage.getItem(lsKey);
        if (stored) {
          const data = JSON.parse(stored);
          get().setLoading('departmentsList', false);
          return data;
        }

        // Fallback на JSON-файл
        const response = await fetch('../../public/department-list.json');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        get().setLoading('departmentsList', false);
        return data;

      } catch (error) {
        console.error('fetchDepartmentsList error:', error);
        get().setError('departmentsList', error.message);
        get().setLoading('departmentsList', false);
        throw error;
      }
    },

    /**
     * Загрузить конфигурацию отдела
     * Проверяет localStorage (редактированные данные), затем JSON-файл
     * @returns {Object} конфиг отдела
     */
    fetchDepartmentConfig: async (departmentId) => {
      get().setLoading('departmentConfig', true);
      get().clearError('departmentConfig');

      try {
        // Сначала проверяем localStorage (если конфиг был отредактирован)
        const lsKey = STORAGE_KEYS.departmentConfig(departmentId);
        const stored = localStorage.getItem(lsKey);
        if (stored) {
          const data = JSON.parse(stored);
          get().setLoading('departmentConfig', false);
          return data;
        }

        // Fallback на JSON-файл
        const response = await fetch(
          `../../public/departments-config-${departmentId}.json`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        get().setLoading('departmentConfig', false);
        return data;

      } catch (error) {
        console.error('fetchDepartmentConfig error:', error);
        get().setError('departmentConfig', error.message);
        get().setLoading('departmentConfig', false);
        throw error;
      }
    },

    // === EMPLOYEES API ===

    /**
     * Загрузить список сотрудников отдела
     * @param {string} departmentId
     * @param {Object} options - { mode: 'production' | 'draft' }
     * @returns {{ employeeById, employeeIds }}
     */
    fetchDepartmentEmployees: async (departmentId, options = {}) => {
      const { mode = 'production' } = options;

      get().setLoading('departmentConfig', true);
      get().clearError('departmentConfig');

      try {
        console.log(`📥 fetchDepartmentEmployees [${mode}]: ${departmentId}`);

        let stored;

        if (mode === 'draft') {
          // Сначала пытаемся загрузить draft сотрудников
          const draftKey = STORAGE_KEYS.draftEmployees(departmentId);
          stored = localStorage.getItem(draftKey);

          // Если draft не найден - fallback на production
          if (!stored) {
            const prodKey = STORAGE_KEYS.employees(departmentId);
            stored = localStorage.getItem(prodKey);
          }
        } else {
          const key = STORAGE_KEYS.employees(departmentId);
          stored = localStorage.getItem(key);
        }

        if (!stored) {
          throw new Error(`Сотрудники отдела ${departmentId} не найдены в localStorage`);
        }

        const data = JSON.parse(stored);

        get().setLoading('departmentConfig', false);
        return data;

      } catch (error) {
        console.error('fetchDepartmentEmployees error:', error);
        get().setError('departmentConfig', error.message);
        get().setLoading('departmentConfig', false);
        throw error;
      }
    },

    /**
     * Получить список доступных годов для отдела
     * @param {string} departmentId
     * @returns {{ departmentId, name, years: string[] }}
     */
    fetchDepartmentYears: async (departmentId) => {
      get().setLoading('departmentYears', true);
      get().clearError('departmentYears');

      try {
        console.log(`📥 fetchDepartmentYears: ${departmentId}`);

        // Загружаем из localStorage
        const key = STORAGE_KEYS.availableYears(departmentId);
        const stored = localStorage.getItem(key);
        const years = stored ? JSON.parse(stored) : [];

        const data = {
          departmentId,
          name: 'Отдел',
          years
        };

        get().setLoading('departmentYears', false);
        return data;

      } catch (error) {
        console.error('fetchDepartmentYears error:', error);
        get().setError('departmentYears', error.message);
        get().setLoading('departmentYears', false);
        throw error;
      }
    },

    /**
     * Получить список версий года для отдела
     * @param {string} departmentId
     * @param {number|string} year
     * @returns {{ departmentId, name, year, versions: string[] }}
     */
    fetchYearVersions: async (departmentId, year) => {
      get().setLoading('yearVersions', true);
      get().clearError('yearVersions');

      try {
        console.log(`📥 fetchYearVersions: ${departmentId}/${year}`);

        // Загружаем из localStorage
        const key = STORAGE_KEYS.versions(departmentId, year);
        const stored = localStorage.getItem(key);
        const versionsData = stored ? JSON.parse(stored) : {};

        // Извлекаем ID версий
        const versions = Object.keys(versionsData).sort().reverse(); // новые сначала

        const data = {
          departmentId,
          name: 'Отдел',
          year: Number(year),
          versions
        };

        get().setLoading('yearVersions', false);
        return data;

      } catch (error) {
        console.error('fetchYearVersions error:', error);
        get().setError('yearVersions', error.message);
        get().setLoading('yearVersions', false);
        throw error;
      }
    },

    /**
     * Получить расписание конкретной версии
     * @param {string} departmentId
     * @param {number|string} year
     * @param {string} version
     * @returns {{ year, version, departmentId, scheduleMap }}
     */
    fetchVersionSchedule: async (departmentId, year, version) => {
      get().setLoading('versionSchedule', true);
      get().clearError('versionSchedule');

      try {
        console.log(`📥 fetchVersionSchedule: ${departmentId}/${year}/${version}`);

        // Загружаем версию из localStorage
        const key = STORAGE_KEYS.versions(departmentId, year);
        const stored = localStorage.getItem(key);

        if (!stored) {
          throw new Error(`Версии для ${departmentId}/${year} не найдены`);
        }

        const versionsData = JSON.parse(stored);
        const versionData = versionsData[version];

        if (!versionData) {
          throw new Error(`Версия ${version} не найдена`);
        }

        // Версии хранятся в нормализованном формате
        get().setLoading('versionSchedule', false);
        return {
          year: Number(year),
          version,
          departmentId,
          scheduleMap: versionData.scheduleMap
        };

      } catch (error) {
        console.error('fetchVersionSchedule error:', error);
        get().setError('versionSchedule', error.message);
        get().setLoading('versionSchedule', false);
        throw error;
      }
    },

    // === MONTH NORMS API ===

    /**
     * Получить нормы часов по месяцам для года
     * @param {string} departmentId
     * @param {number|string} year
     * @returns {Object|null} { "2025-01": 160, ... } или null
     */
    fetchMonthNorms: (departmentId, year) => {
      const key = STORAGE_KEYS.monthNorms(departmentId, year);
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    },

}));

export default useFetchWebStore;
