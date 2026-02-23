import { create } from 'zustand';
import { useFetchWebStore } from '../fetchWebStore';
import { usePostWebStore } from '../postWebStore';
import { useUserStore } from '../userStore';
import { useDateAdminStore } from '../dateAdminStore';
import { useVersionsStore } from '../versionsStore';
import { useHoursStore } from './hoursStore';

export const useAdminStore = create((set, get) => ({
    // === UI STATE ===
    isCreatingNewYear: false,      // Флаг создания нового года (защита от race condition)

    // === DRAFT STATE ===
    draftSchedule: {},             // Рабочая копия: { "empId-date": "status" }
    originalSchedule: {},          // Исходное состояние (для сравнения при undo)
    employeeIds: [],               // Список ID сотрудников
    employeeById: {},              // Данные сотрудников: { id: { id, name, fullName, position } }
    hasUnsavedChanges: false,
    undoStack: [],                 // Для Ctrl+Z
    lastDraftSaved: null,          // Timestamp последнего сохранения черновика

    // === VERSIONING ===
    baseVersion: null,             // Версия прода, на основе которой создан черновик
    changedCells: {},              // Изменённые ячейки: { "empId-date": "status" }
    prodVersion: null,             // Текущая версия production (для сравнения)

    // Текущий редактируемый год и отдел
    editingYear: null,
    editingDepartmentId: null,

    // === YEARS ===
    availableYears: [],            // Доступные года для отдела: ["2024", "2025", "2026"]
    loadingYears: false,

    // === DRAFT OPERATIONS ===

    /**
     * Инициализировать draft — загружает данные через fetchWebStore
     * @param {string} departmentId - ID отдела
     * @param {number} year - год
     */
    initializeDraft: async (departmentId, year) => {
      console.log(`📋 Инициализация draft для отдела ${departmentId}, год ${year}`);

      // Валидация
      if (!departmentId || !year) {
        console.error('initializeDraft: departmentId и year обязательны');
        return;
      }

      // Проверка: не идет ли сейчас создание нового года?
      if (get().isCreatingNewYear) {
        console.log('⏳ Создание нового года в процессе, пропускаем initializeDraft');
        return;
      }

      try {
        const fetchStore = useFetchWebStore.getState();

        // Загружаем draft, production версию и сотрудников параллельно
        const [draftData, prodVersionData, employeesData] = await Promise.all([
          fetchStore.fetchSchedule(departmentId, year, { mode: 'draft' }),
          fetchStore.fetchScheduleVersion(departmentId, year),
          fetchStore.fetchDepartmentEmployees(departmentId, { mode: 'draft' })
        ]);

        const { scheduleMap, baseVersion: savedBaseVersion, changedCells: savedChangedCells } = draftData;
        const { version: currentProdVersion } = prodVersionData;
        const { employeeById, employeeIds } = employeesData;

        // Фильтруем только нужный год
        const yearPrefix = `${year}-`;
        const yearData = {};
        Object.entries(scheduleMap).forEach(([key, value]) => {
          if (key.includes(yearPrefix)) {
            yearData[key] = value;
          }
        });

        if (Object.keys(yearData).length > 0) {
          const baseVersion = savedBaseVersion !== undefined ? savedBaseVersion : currentProdVersion;
          const changedCells = savedChangedCells || {};

          set({
            draftSchedule: { ...yearData },
            originalSchedule: { ...yearData },
            employeeIds: employeeIds,
            employeeById: employeeById || {},
            hasUnsavedChanges: false,
            undoStack: [],
            editingYear: year,
            editingDepartmentId: departmentId,
            baseVersion,
            changedCells,
            prodVersion: currentProdVersion
          });

          const isSynced = baseVersion === currentProdVersion;
          console.log(`✅ Draft инициализирован: ${Object.keys(yearData).length} ячеек, baseVersion: ${baseVersion}, prodVersion: ${currentProdVersion}, synced: ${isSynced}, changedCells: ${Object.keys(changedCells).length}`);
        } else {
          console.log(`📝 Создание пустого draft для ${year}`);
          get().createEmptyYear(year, employeeIds, employeeById || {}, departmentId);
        }

      } catch (error) {
        console.error('Failed to initialize draft:', error);

        const currentState = get();
        if (currentState.editingYear === year &&
            currentState.employeeIds.length > 0 &&
            Object.keys(currentState.draftSchedule).length > 0) {
          console.log('✅ Draft уже существует для этого года, пропускаем повторное создание');
          return;
        }

        const employeeIds = currentState.employeeIds.length > 0
          ? currentState.employeeIds
          : [];
        const employeeById = Object.keys(currentState.employeeById).length > 0
          ? currentState.employeeById
          : {};

        get().createEmptyYear(year, employeeIds, employeeById, departmentId);
      }
    },

    // Создать пустой год
    createEmptyYear: (year, employeeIds, employeeById, departmentId, prodVersion = null) => {
      const emptyDraft = {};

      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().slice(0, 10);
        employeeIds.forEach(empId => {
          emptyDraft[`${empId}-${dateStr}`] = '';
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Добавляем первые 3 месяца следующего года (для offset таблицы)
      const nextYearStart = new Date(year + 1, 0, 1);
      const nextYearEnd = new Date(year + 1, 2, 31);

      const nextYearDate = new Date(nextYearStart);
      while (nextYearDate <= nextYearEnd) {
        const dateStr = nextYearDate.toISOString().slice(0, 10);
        employeeIds.forEach(empId => {
          emptyDraft[`${empId}-${dateStr}`] = '';
        });
        nextYearDate.setDate(nextYearDate.getDate() + 1);
      }

      set({
        draftSchedule: emptyDraft,
        originalSchedule: { ...emptyDraft },
        employeeIds: employeeIds,
        employeeById: employeeById,
        hasUnsavedChanges: false,
        undoStack: [],
        editingYear: year,
        editingDepartmentId: departmentId,
        baseVersion: prodVersion,
        changedCells: {},
        prodVersion: prodVersion
      });
      useVersionsStore.getState().resetVersions();

      console.log(`✅ Создан пустой год ${year} с ${Object.keys(emptyDraft).length} ячейками (включая Q1 ${year + 1}), version: ${prodVersion}`);
    },

    // Обновить одну ячейку в draft (с дельта-обновлением hoursStore)
    updateDraftCell: (employeeId, date, status) => {
      const key = `${employeeId}-${date}`;
      const { draftSchedule } = get();
      const oldStatus = draftSchedule[key] ?? '';

      // Дельта-обновление в hoursStore
      useHoursStore.getState().deltaUpdate(employeeId, date, oldStatus, status);

      set(state => ({
        draftSchedule: {
          ...state.draftSchedule,
          [key]: status
        },
        changedCells: {
          ...state.changedCells,
          [key]: status
        },
        hasUnsavedChanges: true
      }));
    },

    // Массовое обновление ячеек (для вставки)
    batchUpdateDraftCells: (updates) => {
      const { draftSchedule, editingYear } = get();

      // Дельта-обновление в hoursStore
      useHoursStore.getState().batchDeltaUpdate(updates, draftSchedule, editingYear);

      set(state => ({
        draftSchedule: {
          ...state.draftSchedule,
          ...updates
        },
        changedCells: {
          ...state.changedCells,
          ...updates
        },
        hasUnsavedChanges: true
      }));
    },

    // Сохранить состояние для undo
    saveUndoState: () => {
      const { draftSchedule, changedCells, undoStack } = get();
      set({
        undoStack: [...undoStack, {
          draftSchedule: { ...draftSchedule },
          changedCells: { ...changedCells }
        }]
      });
    },

    // Отменить последнее действие (Ctrl+Z)
    undo: () => {
      const { undoStack } = get();
      if (undoStack.length === 0) return false;

      const previousState = undoStack[undoStack.length - 1];
      set({
        draftSchedule: previousState.draftSchedule,
        changedCells: previousState.changedCells,
        undoStack: undoStack.slice(0, -1),
        hasUnsavedChanges: Object.keys(previousState.changedCells).length > 0
      });

      // Полный пересчёт hoursSummary (undo — редкая операция)
      const { employeeIds, editingYear } = get();
      useHoursStore.getState().recalcHoursSummary(previousState.draftSchedule, employeeIds, editingYear);

      return true;
    },

    // Восстановить draft
    restoreDraftSchedule: (previousDraft) => {
      set({
        draftSchedule: previousDraft,
        hasUnsavedChanges: true
      });
    },

    /**
     * Сохранить draft в localStorage (без публикации в production)
     */
    saveDraftToStorage: async () => {
      const { draftSchedule, baseVersion, changedCells, editingDepartmentId, editingYear } = get();

      if (!editingDepartmentId || !editingYear) {
        console.error('Нет активного draft для сохранения');
        return false;
      }

      try {
        const postStore = usePostWebStore.getState();
        await postStore.saveDraftSchedule(editingDepartmentId, editingYear, {
          scheduleMap: draftSchedule,
          baseVersion,
          changedCells
        });

        set({
          lastDraftSaved: new Date().toISOString(),
          hasUnsavedChanges: false
        });

        console.log(`💾 Черновик сохранен: ${editingDepartmentId}/${editingYear}, changedCells: ${Object.keys(changedCells).length}`);
        return true;

      } catch (error) {
        console.error('Failed to save draft:', error);
        throw error;
      }
    },

    /**
     * Опубликовать draft → production
     */
    publishDraft: async () => {
      const {
        draftSchedule,
        baseVersion,
        changedCells,
        prodVersion,
        editingDepartmentId,
        editingYear
      } = get();

      const isSynced = baseVersion === prodVersion;
      let changesToPublish;

      if (isSynced) {
        changesToPublish = { ...changedCells };
        console.log(`📤 Публикация: черновик синхронизирован, отправляем ${Object.keys(changesToPublish).length} изменённых ячеек`);
      } else {
        changesToPublish = { ...draftSchedule };
        console.log(`📤 Публикация: черновик устарел (base: ${baseVersion}, prod: ${prodVersion}), отправляем весь draft (${Object.keys(changesToPublish).length} ячеек)`);
      }

      if (Object.keys(changesToPublish).length === 0) {
        console.log('ℹ️ Нет изменений для публикации');
        return 0;
      }

      try {
        const postStore = usePostWebStore.getState();
        const result = await postStore.publishSchedule(editingDepartmentId, editingYear, changesToPublish);
        const { newVersion, changedCount } = result;

        const userStore = useUserStore.getState();
        userStore.applyChanges(changesToPublish);

        set({
          originalSchedule: { ...draftSchedule },
          hasUnsavedChanges: false,
          undoStack: [],
          baseVersion: newVersion,
          changedCells: {},
          prodVersion: newVersion
        });

        console.log(`✅ Опубликовано ${changedCount} изменений, новая версия: ${newVersion}`);
        return changedCount;

      } catch (error) {
        console.error('Failed to publish:', error);
        throw error;
      }
    },

    /**
     * Проверить, можно ли опубликовать
     */
    canPublish: () => {
      const { baseVersion, changedCells, prodVersion, hasUnsavedChanges } = get();
      const hasChangedCells = Object.keys(changedCells).length > 0;
      const isDraftOutdated = baseVersion !== prodVersion;
      return hasChangedCells || isDraftOutdated || hasUnsavedChanges;
    },

    // Отменить все изменения — вернуть draft к original
    discardDraft: () => {
      const { originalSchedule, employeeIds, editingYear } = get();
      set({
        draftSchedule: { ...originalSchedule },
        hasUnsavedChanges: false,
        undoStack: [],
        changedCells: {}
      });
      // Полный пересчёт hoursSummary
      useHoursStore.getState().recalcHoursSummary({ ...originalSchedule }, employeeIds, editingYear);
    },

    // Очистить draft (при выходе из режима редактирования)
    clearDraft: () => {
      set({
        draftSchedule: {},
        originalSchedule: {},
        employeeIds: [],
        employeeById: {},
        hasUnsavedChanges: false,
        undoStack: [],
        editingYear: null,
        editingDepartmentId: null,
        availableYears: [],
        baseVersion: null,
        changedCells: {},
        prodVersion: null
      });
      useHoursStore.getState().clearHours();
    },

    // Очистить данные draft (без сброса isAdminMode — для смены отдела)
    clearDraftData: () => {
      set({
        draftSchedule: {},
        originalSchedule: {},
        employeeIds: [],
        employeeById: {},
        hasUnsavedChanges: false,
        undoStack: [],
        editingYear: null,
        editingDepartmentId: null,
        availableYears: [],
        baseVersion: null,
        changedCells: {},
        prodVersion: null
      });
      useHoursStore.getState().clearHours();
      useVersionsStore.getState().resetVersions();
    },

    // Очистить данные года (для смены года внутри отдела)
    clearYearData: () => {
      set({
        draftSchedule: {},
        originalSchedule: {},
        employeeIds: [],
        employeeById: {},
        hasUnsavedChanges: false,
        undoStack: [],
        editingYear: null,
        baseVersion: null,
        changedCells: {},
        prodVersion: null
      });
      useHoursStore.getState().clearHours();
      useVersionsStore.getState().resetVersions();
    },

    // === YEARS & VERSIONS ACTIONS ===

    /**
     * Загрузить список доступных годов для отдела
     */
    loadAvailableYears: async (departmentId) => {
      set({ loadingYears: true });

      try {
        const fetchStore = useFetchWebStore.getState();
        const data = await fetchStore.fetchDepartmentYears(departmentId);

        set({
          availableYears: data.years || [],
          loadingYears: false
        });

        return data.years;
      } catch (error) {
        console.error('loadAvailableYears error:', error);
        set({ loadingYears: false });
        throw error;
      }
    },

    /**
     * Создать новый год
     */
    createNewYear: async (year) => {
      let { editingDepartmentId, employeeIds } = get();

      if (!editingDepartmentId) {
        console.error('Не выбран отдел');
        return;
      }

      console.log(`📝 Создание нового года ${year}`);

      set({ isCreatingNewYear: true });

      try {
        if (!employeeIds || employeeIds.length === 0) {
          console.log('📋 Загрузка списка сотрудников отдела...');
          try {
            const fetchStore = useFetchWebStore.getState();
            const employees = await fetchStore.fetchDepartmentEmployees(editingDepartmentId);
            employeeIds = employees.employeeIds;
            console.log(`✅ Загружено ${employeeIds.length} сотрудников`);
          } catch (error) {
            console.error('Не удалось загрузить список сотрудников:', error);
            alert('Не удалось загрузить список сотрудников. Создайте сначала любой существующий год.');
            return;
          }
        }

        const scheduleMap = {};

        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);

        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().slice(0, 10);
          employeeIds.forEach(empId => {
            scheduleMap[`${empId}-${dateStr}`] = '';
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Q1 следующего года для offset таблицы
        const nextYearStart = new Date(year + 1, 0, 1);
        const nextYearEnd = new Date(year + 1, 2, 31);

        const nextYearDate = new Date(nextYearStart);
        while (nextYearDate <= nextYearEnd) {
          const dateStr = nextYearDate.toISOString().slice(0, 10);
          employeeIds.forEach(empId => {
            scheduleMap[`${empId}-${dateStr}`] = '';
          });
          nextYearDate.setDate(nextYearDate.getDate() + 1);
        }

        const postStore = usePostWebStore.getState();
        await postStore.createScheduleYear(editingDepartmentId, year, scheduleMap);

        const { availableYears } = get();
        if (!availableYears.includes(String(year))) {
          set({
            availableYears: [...availableYears, String(year)].sort()
          });
        }

        useDateAdminStore.getState().initializeYear(Number(year));

        await get().initializeDraft(editingDepartmentId, Number(year));

        console.log(`✅ Новый год ${year} создан с ${Object.keys(scheduleMap).length} ячейками`);

      } catch (error) {
        console.error('createNewYear error:', error);
        alert(`Ошибка создания года: ${error.message}`);
        throw error;
      } finally {
        set({ isCreatingNewYear: false });
      }
    },

    /**
     * Загрузить конкретную версию (только для просмотра)
     */
    loadVersion: async (version) => {
      const { editingDepartmentId, editingYear, employeeIds, employeeById } = get();
      if (!editingDepartmentId || !editingYear) return;

      try {
        const fetchStore = useFetchWebStore.getState();
        const data = await fetchStore.fetchVersionSchedule(
          editingDepartmentId,
          editingYear,
          version
        );

        set({
          draftSchedule: { ...data.scheduleMap },
          originalSchedule: { ...data.scheduleMap },
          employeeIds: employeeIds,
          employeeById: employeeById,
          hasUnsavedChanges: false,
          undoStack: []
        });
        useVersionsStore.getState().setSelectedVersion(version);

        console.log(`✅ Загружена версия ${version}`);
      } catch (error) {
        console.error('loadVersion error:', error);
        throw error;
      }
    },

    /**
     * Вернуться к текущему draft
     */
    exitVersionView: async () => {
      const { editingDepartmentId, editingYear } = get();
      if (!editingDepartmentId || !editingYear) return;

      useVersionsStore.getState().setSelectedVersion(null);
      await get().initializeDraft(editingDepartmentId, editingYear);
    },

    // === GETTERS ===

    getDraftCellStatus: (employeeId, date) => {
      const key = `${employeeId}-${date}`;
      return get().draftSchedule[key] ?? '';
    },

    isCellModified: (employeeId, date) => {
      const key = `${employeeId}-${date}`;
      const { draftSchedule, originalSchedule } = get();
      return draftSchedule[key] !== originalSchedule[key];
    }
}));

export default useAdminStore;
