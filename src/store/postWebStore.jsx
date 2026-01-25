import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { STORAGE_KEYS } from '../services/localStorageInit';

/**
 * postWebStore — запись данных в localStorage (имитация POST/PUT/DELETE)
 *
 * Все данные хранятся в НОРМАЛИЗОВАННОМ виде:
 * - schedule-{dept}-{year}       → scheduleMap
 * - draft-schedule-{dept}-{year} → scheduleMap черновика
 * - employees-{dept}             → { employeeById, employeeIds }
 * - draft-employees-{dept}       → { employeeById, employeeIds }
 */
export const usePostWebStore = create(
  devtools((set, get) => ({
    // === STATE ===
    saving: {
      schedule: false,
      draft: false,
      employees: false
    },
    errors: {
      schedule: null,
      draft: null,
      employees: null
    },

    // === HELPERS ===
    setSaving: (key, value) => {
      set(state => ({
        saving: { ...state.saving, [key]: value }
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
     * Опубликовать изменения (применить draft → production)
     * @param {string} departmentId
     * @param {number} year
     * @param {Object} changes - { "empId-date": "status", ... }
     * @returns {Object} результат сохранения
     */
    publishSchedule: async (departmentId, year, changes) => {
      get().setSaving('schedule', true);
      get().clearError('schedule');

      try {
        console.log(`💾 Публикация изменений: ${departmentId}/${year}, ${Object.keys(changes).length} ячеек`);

        // Имитация задержки сети
        await new Promise(resolve => setTimeout(resolve, 300));

        // Загружаем текущее расписание (уже нормализованное)
        const key = STORAGE_KEYS.schedule(departmentId, year);
        const stored = localStorage.getItem(key);

        if (!stored) {
          throw new Error(`Расписание ${departmentId}/${year} не найдено`);
        }

        const scheduleMap = JSON.parse(stored);

        // Применяем изменения
        Object.entries(changes).forEach(([cellKey, newStatus]) => {
          scheduleMap[cellKey] = newStatus;
        });

        // Сохраняем обновленное расписание
        localStorage.setItem(key, JSON.stringify(scheduleMap));

        // Создаем версию (snapshot)
        const now = new Date();
        const versionId = `${year}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
        get().createVersion(departmentId, year, versionId, scheduleMap);

        get().setSaving('schedule', false);

        console.log(`✅ Опубликовано ${Object.keys(changes).length} изменений`);
        return { success: true, changedCount: Object.keys(changes).length };

      } catch (error) {
        console.error('publishSchedule error:', error);
        get().setError('schedule', error.message);
        get().setSaving('schedule', false);
        throw error;
      }
    },

    /**
     * Создать новый год в базе
     * @param {string} departmentId
     * @param {number} year
     * @param {Object} scheduleMap - нормализованное расписание
     */
    createScheduleYear: async (departmentId, year, scheduleMap) => {
      get().setSaving('schedule', true);
      get().clearError('schedule');

      try {
        console.log(`📝 Создание нового года: ${departmentId}/${year}`);

        const key = STORAGE_KEYS.schedule(departmentId, year);

        // Проверка: год уже существует?
        if (localStorage.getItem(key)) {
          throw new Error(`Год ${year} уже существует`);
        }

        // Сохраняем новый год (уже нормализованный scheduleMap)
        localStorage.setItem(key, JSON.stringify(scheduleMap));

        // Обновляем список доступных годов
        const yearsKey = STORAGE_KEYS.availableYears(departmentId);
        const stored = localStorage.getItem(yearsKey);
        const years = stored ? JSON.parse(stored) : [];

        if (!years.includes(String(year))) {
          years.push(String(year));
          years.sort();
          localStorage.setItem(yearsKey, JSON.stringify(years));
        }

        get().setSaving('schedule', false);

        console.log(`✅ Год ${year} создан`);
        return { success: true, year };

      } catch (error) {
        console.error('createScheduleYear error:', error);
        get().setError('schedule', error.message);
        get().setSaving('schedule', false);
        throw error;
      }
    },

    // === DRAFT API ===

    /**
     * Сохранить draft расписания в localStorage
     * @param {string} departmentId
     * @param {number} year
     * @param {Object} scheduleMap - нормализованный scheduleMap
     */
    saveDraftSchedule: async (departmentId, year, scheduleMap) => {
      get().setSaving('draft', true);
      get().clearError('draft');

      try {
        const key = STORAGE_KEYS.draftSchedule(departmentId, year);
        localStorage.setItem(key, JSON.stringify(scheduleMap));

        get().setSaving('draft', false);

        console.log(`💾 Draft schedule сохранен: ${departmentId}/${year}`);
        return { success: true };

      } catch (error) {
        console.error('saveDraftSchedule error:', error);
        get().setError('draft', error.message);
        get().setSaving('draft', false);
        throw error;
      }
    },

    /**
     * Сохранить draft сотрудников
     * @param {string} departmentId
     * @param {Object} employeesData - { employeeById, employeeIds }
     */
    saveDraftEmployees: async (departmentId, employeesData) => {
      get().setSaving('draft', true);
      get().clearError('draft');

      try {
        const key = STORAGE_KEYS.draftEmployees(departmentId);
        localStorage.setItem(key, JSON.stringify(employeesData));

        get().setSaving('draft', false);

        console.log(`💾 Draft employees сохранен: ${departmentId}`);
        return { success: true };

      } catch (error) {
        console.error('saveDraftEmployees error:', error);
        get().setError('draft', error.message);
        get().setSaving('draft', false);
        throw error;
      }
    },

    /**
     * Удалить draft расписания
     */
    deleteDraftSchedule: async (departmentId, year) => {
      try {
        const key = STORAGE_KEYS.draftSchedule(departmentId, year);
        localStorage.removeItem(key);

        console.log(`🗑️ Draft schedule удален: ${departmentId}/${year}`);
        return { success: true };

      } catch (error) {
        console.error('deleteDraftSchedule error:', error);
        throw error;
      }
    },

    /**
     * Удалить draft сотрудников
     */
    deleteDraftEmployees: async (departmentId) => {
      try {
        const key = STORAGE_KEYS.draftEmployees(departmentId);
        localStorage.removeItem(key);

        console.log(`🗑️ Draft employees удален: ${departmentId}`);
        return { success: true };

      } catch (error) {
        console.error('deleteDraftEmployees error:', error);
        throw error;
      }
    },

    // === VERSIONS API ===

    /**
     * Создать версию (snapshot) расписания
     * @param {string} departmentId
     * @param {number} year
     * @param {string} versionId
     * @param {Object} scheduleMap - нормализованный scheduleMap
     */
    createVersion: async (departmentId, year, versionId, scheduleMap) => {
      try {
        const key = STORAGE_KEYS.versions(departmentId, year);
        const stored = localStorage.getItem(key);
        const versions = stored ? JSON.parse(stored) : {};

        // Сохраняем версию в нормализованном формате
        versions[versionId] = {
          id: versionId,
          scheduleMap,
          createdAt: new Date().toISOString()
        };

        localStorage.setItem(key, JSON.stringify(versions));

        console.log(`📸 Версия создана: ${versionId}`);
        return { success: true, versionId };

      } catch (error) {
        console.error('createVersion error:', error);
        throw error;
      }
    },

    // === EMPLOYEES API ===

    /**
     * Обновить список сотрудников отдела (production)
     * @param {string} departmentId
     * @param {Object} employeesData - { employeeById, employeeIds }
     */
    updateEmployees: async (departmentId, employeesData) => {
      get().setSaving('employees', true);
      get().clearError('employees');

      try {
        const key = STORAGE_KEYS.employees(departmentId);
        localStorage.setItem(key, JSON.stringify(employeesData));

        get().setSaving('employees', false);

        console.log(`✅ Сотрудники обновлены: ${departmentId}`);
        return { success: true };

      } catch (error) {
        console.error('updateEmployees error:', error);
        get().setError('employees', error.message);
        get().setSaving('employees', false);
        throw error;
      }
    },

    // === LEGACY (для совместимости) ===

    /**
     * @deprecated Используйте saveDraftSchedule
     */
    saveDraft: async (departmentId, year, draftData) => {
      console.warn('⚠️ saveDraft is deprecated, use saveDraftSchedule instead');
      return get().saveDraftSchedule(departmentId, year, draftData.draftSchedule || draftData);
    },

    /**
     * @deprecated Используйте deleteDraftSchedule
     */
    deleteDraft: async (departmentId, year) => {
      console.warn('⚠️ deleteDraft is deprecated, use deleteDraftSchedule instead');
      return get().deleteDraftSchedule(departmentId, year);
    }

  }), { name: 'PostWebStore' })
);

export default usePostWebStore;
