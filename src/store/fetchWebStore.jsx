import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * fetchWebStore — единый сетевой слой для всех API запросов
 *
 * Все stores используют этот store для получения данных с сервера.
 * Это обеспечивает:
 * - Единую точку для сетевых запросов
 * - Централизованную обработку ошибок
 * - Возможность легко переключить на реальный API
 */
export const useFetchWebStore = create(
  devtools((set, get) => ({
    // === STATE ===
    loading: {
      schedule: false,
      scheduleDraft: false,
      departmentsList: false,
      departmentConfig: false,
      publish: false
    },
    errors: {
      schedule: null,
      scheduleDraft: null,
      departmentsList: null,
      departmentConfig: null,
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
        // TODO: Разные endpoints для production и draft
        // const endpoint = mode === 'draft'
        //   ? `/api/admin/draft/${departmentId}/${year}`
        //   : `/api/schedule/${departmentId}/${year}`;

        // Пока используем один файл для обоих режимов
        const url = `../../public/data-${departmentId}-${year}.json`;
        console.log(`📥 fetchSchedule [${mode}]: ${url}`);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const normalized = get().normalizeScheduleData(data, year);

        get().setLoading(loadingKey, false);
        return normalized;

      } catch (error) {
        console.error(`fetchSchedule [${mode}] error:`, error);
        get().setError(loadingKey, error.message);
        get().setLoading(loadingKey, false);
        throw error;
      }
    },

    /**
     * Нормализация данных расписания с сервера
     */
    normalizeScheduleData: (rawData, year) => {
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
     * @returns {Object} конфиг отдела
     */
    fetchDepartmentConfig: async (departmentId) => {
      get().setLoading('departmentConfig', true);
      get().clearError('departmentConfig');

      try {
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

    // === ADMIN API ===

    /**
     * Опубликовать изменения расписания
     * @param {string} departmentId
     * @param {Object} changes - { "empId-date": "status", ... }
     * @returns {Object} результат публикации
     */
    publishSchedule: async (departmentId, changes) => {
      get().setLoading('publish', true);
      get().clearError('publish');

      try {
        // TODO: Реальный API запрос
        // const response = await fetch('/api/admin/publish', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ departmentId, changes })
        // });
        // const result = await response.json();

        // Заглушка — имитация успешной публикации
        console.log(`📤 Публикация ${Object.keys(changes).length} изменений для отдела ${departmentId}`);

        // Имитация задержки сети
        await new Promise(resolve => setTimeout(resolve, 300));

        get().setLoading('publish', false);
        return { success: true, changedCount: Object.keys(changes).length };

      } catch (error) {
        console.error('publishSchedule error:', error);
        get().setError('publish', error.message);
        get().setLoading('publish', false);
        throw error;
      }
    }

  }), { name: 'FetchWebStore' })
);

export default useFetchWebStore;
