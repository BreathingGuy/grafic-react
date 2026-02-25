import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { STORAGE_KEYS } from '../services/localStorageInit';

/**
 * postWebStore — запись данных в localStorage (имитация POST/PUT/DELETE)
 *
 * Все данные хранятся в НОРМАЛИЗОВАННОМ виде с версионированием:
 * - schedule-{dept}-{year}       → { scheduleMap, version }
 * - draft-schedule-{dept}-{year} → { scheduleMap, baseVersion, changedCells }
 * - employees-{dept}             → { employeeById, employeeIds }
 * - draft-employees-{dept}       → { employeeById, employeeIds }
 *
 * Версионирование (инкрементное):
 * - version        — номер версии прода (1, 2, 3, ...)
 * - baseVersion    — версия прода, на основе которой создан черновик
 * - changedCells   — ячейки, изменённые в черновике
 */
export const usePostWebStore = create(devtools((set, get) => ({
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
     * @returns {Object} результат сохранения с newVersion
     */
    publishSchedule: async (departmentId, year, changes) => {
      get().setSaving('schedule', true);
      get().clearError('schedule');

      try {
        console.log(`💾 Публикация изменений: ${departmentId}/${year}, ${Object.keys(changes).length} ячеек`);

        // Имитация задержки сети
        await new Promise(resolve => setTimeout(resolve, 300));

        // Загружаем текущее расписание
        const key = STORAGE_KEYS.schedule(departmentId, year);
        const stored = localStorage.getItem(key);

        if (!stored) {
          throw new Error(`Расписание ${departmentId}/${year} не найдено`);
        }

        const prodData = JSON.parse(stored);
        // Поддержка старого формата (просто scheduleMap) и нового ({ scheduleMap, version })
        const scheduleMap = prodData.scheduleMap || prodData;
        const currentVersion = prodData.version || 0;

        // Применяем изменения
        Object.entries(changes).forEach(([cellKey, newStatus]) => {
          scheduleMap[cellKey] = newStatus;
        });

        // Новая версия = текущая + 1
        const newVersion = currentVersion + 1;

        // Сохраняем обновленное расписание с версией
        const newProdData = {
          scheduleMap,
          version: newVersion
        };
        localStorage.setItem(key, JSON.stringify(newProdData));

        // Создаем snapshot версии
        const now = new Date();
        const versionId = `${year}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
        get().createVersion(departmentId, year, versionId, scheduleMap);

        get().setSaving('schedule', false);

        console.log(`✅ Опубликовано ${Object.keys(changes).length} изменений, version: ${newVersion}`);
        return { success: true, changedCount: Object.keys(changes).length, newVersion };

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
     * @returns {Object} { success, year, version }
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

        // Начальная версия для нового года
        const version = 1;

        // Сохраняем новый год с версией
        const data = {
          scheduleMap,
          version
        };
        localStorage.setItem(key, JSON.stringify(data));

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

        console.log(`✅ Год ${year} создан, version: ${version}`);
        return { success: true, year, version };

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
     * @param {Object} draftData - { scheduleMap, baseVersion, changedCells }
     */
    saveDraftSchedule: async (departmentId, year, draftData) => {
      get().setSaving('draft', true);
      get().clearError('draft');

      try {
        const key = STORAGE_KEYS.draftSchedule(departmentId, year);

        // Поддержка обоих форматов: объект с версиями или просто scheduleMap
        const dataToSave = draftData.scheduleMap
          ? draftData
          : { scheduleMap: draftData, baseVersion: null, changedCells: {} };

        localStorage.setItem(key, JSON.stringify(dataToSave));

        get().setSaving('draft', false);

        const changedCount = Object.keys(dataToSave.changedCells || {}).length;
        console.log(`💾 Draft schedule сохранен: ${departmentId}/${year}, baseVersion: ${dataToSave.baseVersion}, changed: ${changedCount}`);
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

    // === DEPARTMENT CONFIG API ===

    /**
     * Сохранить конфигурацию отдела (statusConfig, name)
     * @param {string} departmentId
     * @param {Object} config - { departmentId, name, statusConfig }
     */
    saveDepartmentConfig: async (departmentId, config) => {
      try {
        const key = STORAGE_KEYS.departmentConfig(departmentId);
        localStorage.setItem(key, JSON.stringify(config));

        console.log(`✅ Конфиг отдела сохранен: ${departmentId}`);
        return { success: true };

      } catch (error) {
        console.error('saveDepartmentConfig error:', error);
        throw error;
      }
    },

    /**
     * Обновить имя отдела в списке отделов
     * @param {string} departmentId
     * @param {string} newName
     */
    updateDepartmentName: async (departmentId, newName) => {
      try {
        // Загружаем текущий список
        const lsKey = STORAGE_KEYS.departmentList();
        const stored = localStorage.getItem(lsKey);
        let data;

        if (stored) {
          data = JSON.parse(stored);
        } else {
          // Загружаем из JSON и сохраняем в localStorage
          const response = await fetch('../../public/department-list.json');
          data = await response.json();
        }

        // Обновляем имя
        const dept = data.departments.find(d => d.id === departmentId);
        if (dept) {
          dept.name = newName;
        }

        localStorage.setItem(lsKey, JSON.stringify(data));

        console.log(`✅ Имя отдела обновлено: ${departmentId} → ${newName}`);
        return { success: true };

      } catch (error) {
        console.error('updateDepartmentName error:', error);
        throw error;
      }
    },

    // === MONTH NORMS API ===

    /**
     * Сохранить нормы часов по месяцам для года
     * @param {string} departmentId
     * @param {number|string} year
     * @param {Object} norms - { "2025-01": 160, ... }
     */
    saveMonthNorms: (departmentId, year, norms) => {
      const key = STORAGE_KEYS.monthNorms(departmentId, year);
      localStorage.setItem(key, JSON.stringify(norms));
      console.log(`✅ Нормы месяцев сохранены: ${departmentId}/${year}`);
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

}), { name: 'PostWebStore' }));

export default usePostWebStore;
