import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useFetchWebStore } from './fetchWebStore';
import { usePostWebStore } from './postWebStore';
import { useScheduleStore } from './scheduleStore';
import { useMetaStore } from './metaStore';
import { useDateAdminStore } from './dateAdminStore';
import { useVersionsStore } from './versionsStore';

export const useAdminStore = create(
  persist(
    (set, get) => ({
        // === AUTHENTICATION ===
        isAuthenticated: false,
        user: null,                    // { userId, email, name, token }
        ownedDepartments: [],          // ["dept-1"]
        editableDepartments: [],       // ["dept-1", "dept-2"]

        // === UI STATE ===
        isAdminMode: false,            // Режим админ-консоли
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
        // yearVersions, selectedVersion, loadingVersions — вынесены в versionsStore

        // === UI ACTIONS ===

        toggleAdminMode: () => {
          set(state => ({ isAdminMode: !state.isAdminMode }));
        },

        setAdminMode: (isAdmin) => {
          set({ isAdminMode: isAdmin });
        },

        // === AUTH ACTIONS ===

        login: async (email, _password) => {
          void _password; // Будет использоваться при интеграции API
          // TODO: API call
          // const response = await api.post('/api/auth/login', { email, password });

          // Временная заглушка для разработки
          set({
            isAuthenticated: true,
            user: {
              userId: '1',
              email: email,
              name: 'Admin',
              token: 'dev-token'
            },
            ownedDepartments: ['1'],
            editableDepartments: ['1', '2']
          });
        },

        logout: () => {
          set({
            isAuthenticated: false,
            user: null,
            ownedDepartments: [],
            editableDepartments: [],
            isAdminMode: false,
            draftSchedule: {},
            originalSchedule: {},
            employeeIds: [],
            employeeById: {},
            hasUnsavedChanges: false,
            undoStack: [],
            editingYear: null,
            editingDepartmentId: null,
            availableYears: [],
            loadingYears: false,
            // Versioning
            baseVersion: null,
            changedCells: {},
            prodVersion: null
          });
          // Сброс версий в отдельном сторе
          useVersionsStore.getState().resetVersions();
        },

        canEditDepartment: (departmentId) => {
          return get().editableDepartments.includes(departmentId);
        },

        isOwner: (departmentId) => {
          return get().ownedDepartments.includes(departmentId);
        },

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
              // Определяем версионирование:
              // - Если есть сохранённый baseVersion - используем его
              // - Если нет (fallback на production) - baseVersion = prodVersion (черновик синхронизирован)
              const baseVersion = savedBaseVersion !== undefined ? savedBaseVersion : currentProdVersion;
              const changedCells = savedChangedCells || {};

              // Год существует — копируем
              set({
                draftSchedule: { ...yearData },
                originalSchedule: { ...yearData },
                employeeIds: employeeIds,
                employeeById: employeeById || {},
                hasUnsavedChanges: false,
                undoStack: [],
                editingYear: year,
                editingDepartmentId: departmentId,
                // Versioning
                baseVersion,
                changedCells,
                prodVersion: currentProdVersion
              });
              // yearVersions сбрасываются в enterAdminContext

              const isSynced = baseVersion === currentProdVersion;
              console.log(`✅ Draft инициализирован: ${Object.keys(yearData).length} ячеек, baseVersion: ${baseVersion}, prodVersion: ${currentProdVersion}, synced: ${isSynced}, changedCells: ${Object.keys(changedCells).length}`);
            } else {
              // Год не существует — создаём пустой
              console.log(`📝 Создание пустого draft для ${year}`);
              get().createEmptyYear(year, employeeIds, employeeById || {}, departmentId);
            }

          } catch (error) {
            console.error('Failed to initialize draft:', error);

            // Проверяем - может быть draft уже создан (новый год)?
            const currentState = get();
            if (currentState.editingYear === year &&
                currentState.employeeIds.length > 0 &&
                Object.keys(currentState.draftSchedule).length > 0) {
              console.log('✅ Draft уже существует для этого года, пропускаем повторное создание');
              return;
            }

            // Создаём пустой draft если загрузка не удалась
            // Используем текущих сотрудников из state если они есть
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

          // Генерируем все даты года
          const startDate = new Date(year, 0, 1);
          const endDate = new Date(year, 11, 31);

          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().slice(0, 10);

            employeeIds.forEach(empId => {
              emptyDraft[`${empId}-${dateStr}`] = '';  // Пустая ячейка
            });

            currentDate.setDate(currentDate.getDate() + 1);
          }

          // Добавляем первые 3 месяца следующего года (для offset таблицы)
          const nextYearStart = new Date(year + 1, 0, 1);
          const nextYearEnd = new Date(year + 1, 2, 31); // конец марта следующего года

          const nextYearDate = new Date(nextYearStart);
          while (nextYearDate <= nextYearEnd) {
            const dateStr = nextYearDate.toISOString().slice(0, 10);

            employeeIds.forEach(empId => {
              emptyDraft[`${empId}-${dateStr}`] = '';  // Пустая ячейка
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
            // Versioning: новый год начинается синхронизированным
            baseVersion: prodVersion,
            changedCells: {},
            prodVersion: prodVersion
          });
          // Сброс версий для нового года
          useVersionsStore.getState().resetVersions();

          console.log(`✅ Создан пустой год ${year} с ${Object.keys(emptyDraft).length} ячейками (включая Q1 ${year + 1}), version: ${prodVersion}`);
        },

        // Обновить одну ячейку в draft
        updateDraftCell: (employeeId, date, status) => {
          const key = `${employeeId}-${date}`;

          set(state => ({
            draftSchedule: {
              ...state.draftSchedule,
              [key]: status
            },
            // Добавляем в changedCells
            changedCells: {
              ...state.changedCells,
              [key]: status
            },
            hasUnsavedChanges: true
          }));
        },

        // Массовое обновление ячеек (для вставки)
        batchUpdateDraftCells: (updates) => {
          set(state => ({
            draftSchedule: {
              ...state.draftSchedule,
              ...updates
            },
            // Добавляем все обновления в changedCells
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

          return true;
        },

        // Восстановить draft (альтернатива undo для полного восстановления)
        restoreDraftSchedule: (previousDraft) => {
          set({
            draftSchedule: previousDraft,
            hasUnsavedChanges: true
          });
        },

        /**
         * Сохранить draft в localStorage (без публикации в production)
         * Сохраняет черновик с версионированием
         */
        saveDraftToStorage: async () => {
          const { draftSchedule, baseVersion, changedCells, editingDepartmentId, editingYear } = get();

          if (!editingDepartmentId || !editingYear) {
            console.error('Нет активного draft для сохранения');
            return false;
          }

          try {
            // Сохраняем через postWebStore с версионированием
            const postStore = usePostWebStore.getState();
            await postStore.saveDraftSchedule(editingDepartmentId, editingYear, {
              scheduleMap: draftSchedule,
              baseVersion,
              changedCells
            });

            // Обновляем timestamp последнего сохранения
            // hasUnsavedChanges остаётся true если есть changedCells
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
         *
         * Логика версионирования:
         * - Если baseVersion === prodVersion → публикуем только changedCells (оптимизация)
         * - Если baseVersion !== prodVersion → публикуем весь draftSchedule (черновик устарел)
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

          // Определяем что публиковать
          const isSynced = baseVersion === prodVersion;
          let changesToPublish;

          if (isSynced) {
            // Черновик синхронизирован — публикуем только changedCells
            changesToPublish = { ...changedCells };
            console.log(`📤 Публикация: черновик синхронизирован, отправляем ${Object.keys(changesToPublish).length} изменённых ячеек`);
          } else {
            // Черновик устарел — публикуем весь draft
            // Вычисляем разницу между draft и prod
            // Но поскольку у нас нет prod данных здесь, отправляем весь draftSchedule
            // postWebStore.publishSchedule применит изменения поверх текущего прода
            changesToPublish = { ...draftSchedule };
            console.log(`📤 Публикация: черновик устарел (base: ${baseVersion}, prod: ${prodVersion}), отправляем весь draft (${Object.keys(changesToPublish).length} ячеек)`);
          }

          if (Object.keys(changesToPublish).length === 0) {
            console.log('ℹ️ Нет изменений для публикации');
            return 0;
          }

          try {
            // Отправляем на сервер через postWebStore
            const postStore = usePostWebStore.getState();
            const result = await postStore.publishSchedule(editingDepartmentId, editingYear, changesToPublish);
            const { newVersion, changedCount } = result;

            // Применяем изменения в production (scheduleStore)
            const scheduleStore = useScheduleStore.getState();
            scheduleStore.applyChanges(changesToPublish);

            // Обновляем state: теперь draft синхронизирован с новой версией прода
            set({
              originalSchedule: { ...draftSchedule },
              hasUnsavedChanges: false,
              undoStack: [],
              // Versioning: черновик теперь синхронизирован
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
         * @returns {boolean}
         */
        canPublish: () => {
          const { baseVersion, changedCells, prodVersion, hasUnsavedChanges } = get();

          // Можно публиковать если:
          // 1. Есть изменённые ячейки (changedCells не пуст)
          // 2. ИЛИ черновик не синхронизирован с продом (baseVersion !== prodVersion)
          // 3. ИЛИ есть несохранённые изменения
          const hasChangedCells = Object.keys(changedCells).length > 0;
          const isDraftOutdated = baseVersion !== prodVersion;

          return hasChangedCells || isDraftOutdated || hasUnsavedChanges;
        },

        // Отменить все изменения — вернуть draft к original
        discardDraft: () => {
          const { originalSchedule } = get();
          set({
            draftSchedule: { ...originalSchedule },
            hasUnsavedChanges: false,
            undoStack: [],
            changedCells: {}  // Сбрасываем изменённые ячейки
          });
        },

        // Очистить draft (при выходе из режима редактирования)
        clearDraft: () => {
          set({
            isAdminMode: false,
            draftSchedule: {},
            originalSchedule: {},
            employeeIds: [],
            employeeById: {},
            hasUnsavedChanges: false,
            undoStack: [],
            editingYear: null,
            editingDepartmentId: null,
            availableYears: [],
            yearVersions: [],
            selectedVersion: null,
            // Versioning
            baseVersion: null,
            changedCells: {},
            prodVersion: null
          });
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
            // Versioning
            baseVersion: null,
            changedCells: {},
            prodVersion: null
          });
          useVersionsStore.getState().resetVersions();
        },

        // Очистить данные года (для смены года внутри отдела)
        // Сохраняет: editingDepartmentId, availableYears
        clearYearData: () => {
          set({
            draftSchedule: {},
            originalSchedule: {},
            employeeIds: [],
            employeeById: {},
            hasUnsavedChanges: false,
            undoStack: [],
            editingYear: null,
            // Versioning
            baseVersion: null,
            changedCells: {},
            prodVersion: null
          });
          useVersionsStore.getState().resetVersions();
        },

        // === UNIFIED ENTRY POINT ===

        /**
         * Единая точка входа в админ-контекст
         * Используется для: входа в консоль, смены года, смены отдела
         *
         * @param {string} departmentId - ID отдела
         * @param {number} year - год
         */
        enterAdminContext: async (departmentId, year) => {
          const currentDeptId = get().editingDepartmentId;
          const isDepartmentChange = departmentId !== currentDeptId;

          console.log(`🚀 enterAdminContext: ${departmentId}/${year} (was: ${currentDeptId}/${get().editingYear})`);

          // 1. Сброс версий (отдельный стор — не триггерит employeeIds)
          useVersionsStore.getState().resetVersions();

          // 3. При смене отдела — загрузить годы и проверить что запрошенный год существует
          let targetYear = Number(year);
          if (isDepartmentChange) {
            set({ availableYears: [], editingDepartmentId: departmentId });

            // Загружаем конфиг отдела (для настроек и цветов)
            useMetaStore.getState().loadDepartmentConfig(departmentId);

            try {
              const years = await get().loadAvailableYears(departmentId);
              if (years && years.length > 0 && !years.includes(String(targetYear))) {
                targetYear = Number(years[years.length - 1]);
                console.log(`⚠️ Год ${year} не найден для ${departmentId}, fallback на ${targetYear}`);
              }
            } catch (error) {
              console.error('Не удалось загрузить годы:', error);
            }
          }

          // 4. Инициализация дат
          useDateAdminStore.getState().initializeYear(targetYear);

          // 5. Загрузка draft — заменит все данные в одном set()
          await get().initializeDraft(departmentId, targetYear);
        },

        // === YEARS & VERSIONS ACTIONS ===

        /**
         * Загрузить список доступных годов для отдела
         * @param {string} departmentId
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

        // loadYearVersions вынесен в versionsStore

        /**
         * Переключить год
         * @param {number|string} year
         */
        switchYear: async (year) => {
          const { editingDepartmentId } = get();
          if (!editingDepartmentId) return;

          await get().enterAdminContext(editingDepartmentId, Number(year));
        },

        /**
         * Создать новый год
         * @param {number} year - год для создания
         */
        createNewYear: async (year) => {
          let { editingDepartmentId, employeeIds } = get();

          if (!editingDepartmentId) {
            console.error('Не выбран отдел');
            return;
          }

          console.log(`📝 Создание нового года ${year}`);

          // Устанавливаем флаг создания нового года
          set({ isCreatingNewYear: true });

          try {
            // Если нет списка сотрудников - загружаем его
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

            // Создаём нормализованный scheduleMap для всего года + Q1 следующего
            const scheduleMap = {};

            // Генерируем пустые ячейки для всего года
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

            // Добавляем Q1 следующего года для offset таблицы
            const nextYearStart = new Date(year + 1, 0, 1);
            const nextYearEnd = new Date(year + 1, 2, 31); // конец марта

            const nextYearDate = new Date(nextYearStart);
            while (nextYearDate <= nextYearEnd) {
              const dateStr = nextYearDate.toISOString().slice(0, 10);
              employeeIds.forEach(empId => {
                scheduleMap[`${empId}-${dateStr}`] = '';
              });
              nextYearDate.setDate(nextYearDate.getDate() + 1);
            }

            // Сохранить в localStorage через postWebStore
            const postStore = usePostWebStore.getState();
            await postStore.createScheduleYear(editingDepartmentId, year, scheduleMap);

            // Обновить список доступных годов
            const { availableYears } = get();
            if (!availableYears.includes(String(year))) {
              set({
                availableYears: [...availableYears, String(year)].sort()
              });
            }

            // Обновить dateAdminStore для нового года
            useDateAdminStore.getState().initializeYear(Number(year));

            // Инициализировать draft из сохранённого расписания
            await get().initializeDraft(editingDepartmentId, Number(year));

            console.log(`✅ Новый год ${year} создан с ${Object.keys(scheduleMap).length} ячейками`);

          } catch (error) {
            console.error('createNewYear error:', error);
            alert(`Ошибка создания года: ${error.message}`);
            throw error;
          } finally {
            // Сбрасываем флаг в любом случае
            set({ isCreatingNewYear: false });
          }
        },

        /**
         * Загрузить конкретную версию (только для просмотра)
         * @param {string} version
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

            // Загружаем версию как draft (только для просмотра)
            // Используем текущих сотрудников, версия содержит только scheduleMap
            set({
              draftSchedule: { ...data.scheduleMap },
              originalSchedule: { ...data.scheduleMap },
              employeeIds: employeeIds,  // сохраняем текущих
              employeeById: employeeById, // сохраняем текущих
              hasUnsavedChanges: false,
              undoStack: []
            });
            // selectedVersion в отдельном сторе
            useVersionsStore.getState().setSelectedVersion(version);

            console.log(`✅ Загружена версия ${version}`);
          } catch (error) {
            console.error('loadVersion error:', error);
            throw error;
          }
        },

        /**
         * Вернуться к текущему draft (сбросить просмотр версии)
         */
        exitVersionView: async () => {
          const { editingDepartmentId, editingYear } = get();
          if (!editingDepartmentId || !editingYear) return;

          useVersionsStore.getState().setSelectedVersion(null);
          await get().initializeDraft(editingDepartmentId, editingYear);
        },

        // === GETTERS ===

        // Получить статус ячейки из draft
        getDraftCellStatus: (employeeId, date) => {
          const key = `${employeeId}-${date}`;
          return get().draftSchedule[key] ?? '';
        },

        // Проверить, изменена ли ячейка относительно original
        isCellModified: (employeeId, date) => {
          const key = `${employeeId}-${date}`;
          const { draftSchedule, originalSchedule } = get();
          return draftSchedule[key] !== originalSchedule[key];
        }
      }),
      {
        name: 'admin-storage',
        partialize: (state) => ({
          // Сохраняем только аутентификацию
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          ownedDepartments: state.ownedDepartments,
          editableDepartments: state.editableDepartments
          // НЕ сохраняем draft — он должен загружаться заново
        })
      }
    )
);

export default useAdminStore;
