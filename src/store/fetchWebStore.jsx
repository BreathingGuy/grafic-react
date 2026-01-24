import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { STORAGE_KEYS } from '../services/localStorageInit';

/**
 * fetchWebStore — чтение данных из localStorage (имитация GET запросов)
 *
 * Все stores используют этот store для получения данных.
 * Данные хранятся в localStorage вместо JSON файлов.
 */
export const useFetchWebStore = create(
  devtools((set, get) => ({
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
     * @returns {{ employeeById, employeeIds, scheduleMap }}
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

        // Выбираем правильный ключ в зависимости от режима
        let key, stored;

        if (mode === 'draft') {
          // Сначала пытаемся загрузить draft
          key = STORAGE_KEYS.draft(departmentId, year);
          stored = localStorage.getItem(key);

          // Если draft не найден - fallback на production
          if (!stored) {
            console.log(`📋 Draft не найден, загружаем production как fallback`);
            key = STORAGE_KEYS.schedule(departmentId, year);
            stored = localStorage.getItem(key);
          }
        } else {
          // Production mode - загружаем только production
          key = STORAGE_KEYS.schedule(departmentId, year);
          stored = localStorage.getItem(key);
        }

        if (!stored) {
          throw new Error(`Расписание ${departmentId}/${year} не найдено в localStorage`);
        }

        const data = JSON.parse(stored);

        // Все данные теперь в едином нормализованном формате
        let normalized;

        if (data.draftSchedule && data.employeeIds && data.employeeById) {
          // Draft формат
          console.log(`📋 Загружен draft (${data.employeeIds.length} сотрудников)`);
          normalized = {
            scheduleMap: data.draftSchedule,
            employeeIds: data.employeeIds,
            employeeById: data.employeeById
          };
        } else if (data.scheduleMap && data.employeeIds && data.employeeById) {
          // Production формат (единый нормализованный формат)
          console.log(`📋 Загружен production (${data.employeeIds.length} сотрудников, ${Object.keys(data.scheduleMap).length} ячеек)`);
          normalized = {
            scheduleMap: data.scheduleMap,
            employeeIds: data.employeeIds,
            employeeById: data.employeeById
          };
        } else {
          // Неизвестный формат - возможно данные не инициализированы
          console.error('⚠️ Данные в неизвестном формате:', data);
          throw new Error(`Данные ${departmentId}/${year} в неправильном формате. Возможно требуется переинициализация localStorage.`);
        }

        get().setLoading(loadingKey, false);
        return normalized;

      } catch (error) {
        console.error(`fetchSchedule [${mode}] error:`, error);
        get().setError(loadingKey, error.message);
        get().setLoading(loadingKey, false);
        throw error;
      }
    },

    // === DEPARTMENTS API ===

    /**
     * Загрузить список отделов
     * @returns {{ departments: Array }}
     */
    fetchDepartmentsList: async () => {
      get().setLoading('departmentsList', true);
      get().clearError('departmentsList');

      try {
        // Сначала пытаемся загрузить из localStorage
        const key = 'department-list';
        const stored = localStorage.getItem(key);

        if (stored) {
          const data = JSON.parse(stored);
          get().setLoading('departmentsList', false);
          return data;
        }

        // Fallback: загружаем из файла (первый запуск)
        const response = await fetch('../../public/department-list.json');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Сохраняем в localStorage для будущих запусков
        localStorage.setItem(key, JSON.stringify(data));

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
     * @returns {Object} конфиг отдела
     */
    fetchDepartmentConfig: async (departmentId) => {
      get().setLoading('departmentConfig', true);
      get().clearError('departmentConfig');

      try {
        // Сначала пытаемся загрузить из localStorage
        const key = `department-config-${departmentId}`;
        const stored = localStorage.getItem(key);

        if (stored) {
          const data = JSON.parse(stored);
          get().setLoading('departmentConfig', false);
          return data;
        }

        // Fallback: загружаем из файла (первый запуск)
        const response = await fetch(
          `../../public/departments-config-${departmentId}.json`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Сохраняем в localStorage для будущих запусков
        localStorage.setItem(key, JSON.stringify(data));

        get().setLoading('departmentConfig', false);
        return data;

      } catch (error) {
        console.error('fetchDepartmentConfig error:', error);
        get().setError('departmentConfig', error.message);
        get().setLoading('departmentConfig', false);
        throw error;
      }
    },

    // === ADMIN API ===

    /**
     * Загрузить список сотрудников отдела (без привязки к году)
     * GET /api/departments/{id}/employees
     * @param {string} departmentId
     * @returns {{ employeeById, employeeIds }}
     */
    fetchDepartmentEmployees: async (departmentId) => {
      get().setLoading('departmentConfig', true);
      get().clearError('departmentConfig');

      try {
        console.log(`📥 fetchDepartmentEmployees: ${departmentId}`);

        // Загружаем из localStorage
        const key = STORAGE_KEYS.employees(departmentId);
        const stored = localStorage.getItem(key);

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
     * GET /api/departments/{id}/years
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
     * GET /api/departments/{id}/{year}/versions
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
     * GET /api/departments/{id}/schedule?year={year}&version={version}&include=employees,schedule,buffers
     * @param {string} departmentId
     * @param {number|string} year
     * @param {string} version
     * @returns {{ year, version, departmentId, employeeById, employeeIds, scheduleMap }}
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

        // Нормализуем данные версии
        const normalized = get().normalizeScheduleData(versionData.data, year);

        get().setLoading('versionSchedule', false);
        return {
          year: Number(year),
          version,
          departmentId,
          ...normalized
        };

      } catch (error) {
        console.error('fetchVersionSchedule error:', error);
        get().setError('versionSchedule', error.message);
        get().setLoading('versionSchedule', false);
        throw error;
      }
    },

  }), { name: 'FetchWebStore' })
);

export default useFetchWebStore;
