import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { STORAGE_KEYS } from '../services/localStorageInit';

/**
 * postWebStore — запись данных в localStorage (имитация POST/PUT/DELETE)
 *
 * Все методы записи вынесены сюда для четкого разделения:
 * - fetchWebStore: GET запросы (чтение)
 * - postWebStore: POST/PUT/DELETE запросы (запись)
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
     * Сохранить изменения расписания (опубликовать draft → production)
     * POST /api/schedule/{deptId}/{year}
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

        // Загружаем текущее расписание
        const key = STORAGE_KEYS.schedule(departmentId, year);
        const stored = localStorage.getItem(key);

        if (!stored) {
          throw new Error(`Расписание ${departmentId}/${year} не найдено`);
        }

        const scheduleData = JSON.parse(stored);

        // Применяем изменения к данным
        scheduleData.data.forEach(employee => {
          const employeeId = String(employee.id);

          Object.entries(changes).forEach(([cellKey, newStatus]) => {
            // cellKey формат: "empId-YYYY-MM-DD"
            if (cellKey.startsWith(`${employeeId}-`)) {
              const dateKey = cellKey.split('-').slice(1).join('-'); // "YYYY-MM-DD"
              const monthDay = dateKey.slice(5); // "MM-DD"
              employee.schedule[monthDay] = newStatus;
            }
          });
        });

        // Сохраняем обновленное расписание
        localStorage.setItem(key, JSON.stringify(scheduleData));

        // Создаем версию (snapshot)
        const now = new Date();
        const versionId = `${year}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
        get().createVersion(departmentId, year, versionId, scheduleData);

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
     * POST /api/schedule/{deptId}/{year}/create
     * @param {string} departmentId
     * @param {number} year
     * @param {Object} scheduleData - полные данные расписания
     */
    createScheduleYear: async (departmentId, year, scheduleData) => {
      get().setSaving('schedule', true);
      get().clearError('schedule');

      try {
        console.log(`📝 Создание нового года: ${departmentId}/${year}`);

        const key = STORAGE_KEYS.schedule(departmentId, year);

        // Проверка: год уже существует?
        if (localStorage.getItem(key)) {
          throw new Error(`Год ${year} уже существует`);
        }

        // Сохраняем новый год
        localStorage.setItem(key, JSON.stringify(scheduleData));

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
     * Сохранить draft в localStorage
     * PUT /api/draft/{deptId}/{year}
     * @param {string} departmentId
     * @param {number} year
     * @param {Object} draftData - { draftSchedule, employeeIds, employeeById }
     */
    saveDraft: async (departmentId, year, draftData) => {
      get().setSaving('draft', true);
      get().clearError('draft');

      try {
        const key = STORAGE_KEYS.draft(departmentId, year);

        const payload = {
          ...draftData,
          lastSaved: new Date().toISOString()
        };

        localStorage.setItem(key, JSON.stringify(payload));

        get().setSaving('draft', false);

        console.log(`💾 Draft сохранен: ${departmentId}/${year}`);
        return { success: true };

      } catch (error) {
        console.error('saveDraft error:', error);
        get().setError('draft', error.message);
        get().setSaving('draft', false);
        throw error;
      }
    },

    /**
     * Удалить draft
     * DELETE /api/draft/{deptId}/{year}
     */
    deleteDraft: async (departmentId, year) => {
      try {
        const key = STORAGE_KEYS.draft(departmentId, year);
        localStorage.removeItem(key);

        console.log(`🗑️ Draft удален: ${departmentId}/${year}`);
        return { success: true };

      } catch (error) {
        console.error('deleteDraft error:', error);
        throw error;
      }
    },

    // === VERSIONS API ===

    /**
     * Создать версию (snapshot) расписания
     * POST /api/versions/{deptId}/{year}
     */
    createVersion: async (departmentId, year, versionId, scheduleData) => {
      try {
        const key = STORAGE_KEYS.versions(departmentId, year);
        const stored = localStorage.getItem(key);
        const versions = stored ? JSON.parse(stored) : {};

        // Сохраняем версию
        versions[versionId] = {
          id: versionId,
          data: scheduleData,
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
     * Обновить список сотрудников отдела
     * PUT /api/departments/{deptId}/employees
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

    // === DEPARTMENTS API ===

    /**
     * Создать новый отдел
     * POST /api/departments/create
     * @param {Object} departmentData - { departmentId, departmentName, employees, statusConfig }
     */
    createDepartment: async (departmentData) => {
      get().setSaving('department', true);
      get().clearError('department');

      try {
        const { departmentId, departmentName, employees, statusConfig } = departmentData;

        console.log(`📝 Создание нового отдела: ${departmentId}`);

        // 1. Проверка: отдел уже существует?
        const employeesKey = STORAGE_KEYS.employees(departmentId);
        if (localStorage.getItem(employeesKey)) {
          throw new Error(`Отдел ${departmentId} уже существует`);
        }

        // 2. Сохранить список сотрудников
        const employeeById = {};
        const employeeIds = [];

        employees.forEach(emp => {
          const empId = String(emp.id);
          employeeIds.push(empId);
          employeeById[empId] = {
            id: empId,
            name: `${emp.family} ${emp.name1[0]}.${emp.name2[0]}.`,
            fullName: `${emp.family} ${emp.name1} ${emp.name2}`,
            position: emp.position || ''
          };
        });

        localStorage.setItem(employeesKey, JSON.stringify({ employeeIds, employeeById }));

        // 3. Сохранить конфигурацию отдела
        const configKey = `department-config-${departmentId}`;
        const config = {
          departmentId,
          name: departmentName,
          statusConfig
        };
        localStorage.setItem(configKey, JSON.stringify(config));

        // 4. Обновить список отделов
        const departmentListKey = 'department-list';
        const stored = localStorage.getItem(departmentListKey);
        let departmentList = stored ? JSON.parse(stored) : { departments: [] };

        if (!departmentList.departments) {
          departmentList = { departments: [] };
        }

        // Проверка на дубликат
        const exists = departmentList.departments.some(d => d.id === departmentId);
        if (!exists) {
          departmentList.departments.push({
            id: departmentId,
            name: departmentName
          });
          localStorage.setItem(departmentListKey, JSON.stringify(departmentList));
        }

        // 5. Создать текущий год с пустым расписанием
        const currentYear = new Date().getFullYear();
        const yearsKey = STORAGE_KEYS.availableYears(departmentId);
        localStorage.setItem(yearsKey, JSON.stringify([String(currentYear)]));

        // Создать пустое расписание для текущего года
        const scheduleKey = STORAGE_KEYS.schedule(departmentId, currentYear);
        const emptySchedule = {
          employeeIds,
          employeeById,
          scheduleMap: {} // Пустая карта расписания
        };
        localStorage.setItem(scheduleKey, JSON.stringify(emptySchedule));

        console.log(`📅 Создан год ${currentYear} с пустым расписанием`);

        get().setSaving('department', false);

        console.log(`✅ Отдел ${departmentId} создан`);
        return { success: true, departmentId };

      } catch (error) {
        console.error('createDepartment error:', error);
        get().setError('department', error.message);
        get().setSaving('department', false);
        throw error;
      }
    },

    /**
     * Обновить настройки отдела
     * PUT /api/departments/{departmentId}
     * @param {Object} departmentData - { departmentId, departmentName, employees, statusConfig }
     */
    updateDepartment: async (departmentData) => {
      get().setSaving('department', true);
      get().clearError('department');

      try {
        const { departmentId, departmentName, employees, statusConfig } = departmentData;

        console.log(`📝 Обновление настроек отдела: ${departmentId}`);

        // 1. Обновить список сотрудников
        const employeeById = {};
        const employeeIds = [];

        employees.forEach(emp => {
          const empId = String(emp.id);
          employeeIds.push(empId);
          employeeById[empId] = {
            id: empId,
            name: `${emp.family} ${emp.name1[0]}.${emp.name2[0]}.`,
            fullName: `${emp.family} ${emp.name1} ${emp.name2}`,
            position: emp.position || ''
          };
        });

        const employeesKey = STORAGE_KEYS.employees(departmentId);
        localStorage.setItem(employeesKey, JSON.stringify({ employeeIds, employeeById }));

        // 2. Обновить конфигурацию отдела
        const configKey = `department-config-${departmentId}`;
        const config = {
          departmentId,
          name: departmentName,
          statusConfig
        };
        localStorage.setItem(configKey, JSON.stringify(config));

        // 3. Обновить название в списке отделов
        const departmentListKey = 'department-list';
        const stored = localStorage.getItem(departmentListKey);
        let departmentList = stored ? JSON.parse(stored) : { departments: [] };

        if (!departmentList.departments) {
          departmentList = { departments: [] };
        }

        const deptIndex = departmentList.departments.findIndex(d => d.id === departmentId);
        if (deptIndex !== -1) {
          departmentList.departments[deptIndex].name = departmentName;
          localStorage.setItem(departmentListKey, JSON.stringify(departmentList));
        }

        // 4. Обновить список сотрудников во всех существующих годах
        const yearsKey = STORAGE_KEYS.availableYears(departmentId);
        const yearsStored = localStorage.getItem(yearsKey);
        const years = yearsStored ? JSON.parse(yearsStored) : [];

        years.forEach(year => {
          // Обновить production расписание
          const scheduleKey = STORAGE_KEYS.schedule(departmentId, year);
          const scheduleStored = localStorage.getItem(scheduleKey);

          if (scheduleStored) {
            const schedule = JSON.parse(scheduleStored);

            // Обновляем employeeIds и employeeById
            schedule.employeeIds = employeeIds;
            schedule.employeeById = employeeById;

            localStorage.setItem(scheduleKey, JSON.stringify(schedule));
            console.log(`✅ Обновлены сотрудники для года ${year} (production)`);
          }

          // Обновить draft расписание (если есть)
          const draftKey = STORAGE_KEYS.draft(departmentId, year);
          const draftStored = localStorage.getItem(draftKey);

          if (draftStored) {
            const draft = JSON.parse(draftStored);

            // Обновляем employeeIds и employeeById
            draft.employeeIds = employeeIds;
            draft.employeeById = employeeById;

            localStorage.setItem(draftKey, JSON.stringify(draft));
            console.log(`✅ Обновлены сотрудники для года ${year} (draft)`);
          }
        });

        get().setSaving('department', false);

        console.log(`✅ Настройки отдела ${departmentId} обновлены`);
        return { success: true, departmentId };

      } catch (error) {
        console.error('updateDepartment error:', error);
        get().setError('department', error.message);
        get().setSaving('department', false);
        throw error;
      }
    }

  }), { name: 'PostWebStore' })
);

export default usePostWebStore;
