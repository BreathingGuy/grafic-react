import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useFetchWebStore } from './fetchWebStore';
import { usePostWebStore } from './postWebStore';
import { useScheduleStore } from './scheduleStore';
import { useDateAdminStore } from './dateAdminStore';

export const useAdminStore = create(
  devtools(
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
        originalSchedule: {},          // Исходное состояние (для сравнения)
        employeeIds: [],               // Список ID сотрудников
        employeeById: {},              // Данные сотрудников: { id: { id, name, fullName, position } }
        hasUnsavedChanges: false,
        undoStack: [],                 // Для Ctrl+Z
        lastDraftSaved: null,          // Timestamp последнего сохранения черновика

        // Текущий редактируемый год и отдел
        editingYear: null,
        editingDepartmentId: null,

        // === YEARS & VERSIONS ===
        availableYears: [],            // Доступные года для отдела: ["2024", "2025", "2026"]
        yearVersions: [],              // Версии выбранного года: ["2025.02.15", "2025.03.16", ...]
        selectedVersion: null,         // Выбранная версия (null = текущий draft)
        loadingYears: false,
        loadingVersions: false,

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
            yearVersions: [],
            selectedVersion: null,
            loadingYears: false,
            loadingVersions: false
          });
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

            // ВАЖНО: Всегда загружаем production версию для originalSchedule
            console.log('📥 Загрузка production версии...');
            const productionData = await fetchStore.fetchSchedule(
              departmentId,
              year,
              { mode: 'production' }
            );

            // Фильтруем только нужный год из production
            const yearPrefix = `${year}-`;
            const productionYearData = {};
            Object.entries(productionData.scheduleMap).forEach(([key, value]) => {
              if (key.includes(yearPrefix)) {
                productionYearData[key] = value;
              }
            });

            // Пытаемся загрузить draft
            console.log('📥 Загрузка draft версии...');
            let draftYearData = null;
            try {
              const draftData = await fetchStore.fetchSchedule(
                departmentId,
                year,
                { mode: 'draft' }
              );

              // Фильтруем только нужный год из draft
              const filteredDraft = {};
              Object.entries(draftData.scheduleMap).forEach(([key, value]) => {
                if (key.includes(yearPrefix)) {
                  filteredDraft[key] = value;
                }
              });

              if (Object.keys(filteredDraft).length > 0) {
                draftYearData = filteredDraft;
                console.log(`✅ Draft найден: ${Object.keys(draftYearData).length} ячеек`);
              }
            } catch (draftError) {
              console.log('ℹ️ Draft не найден, используем production');
            }

            // Устанавливаем state:
            // - originalSchedule = production (для вычисления changedCells при публикации)
            // - draftSchedule = draft (если есть) или копия production (если нет)
            const scheduleToEdit = draftYearData || { ...productionYearData };

            // Проверяем, есть ли реальные изменения между draft и production
            let hasRealChanges = false;
            if (draftYearData) {
              // Сравниваем draft с production
              const draftKeys = Object.keys(draftYearData);
              const productionKeys = Object.keys(productionYearData);

              if (draftKeys.length !== productionKeys.length) {
                hasRealChanges = true;
              } else {
                for (const key of draftKeys) {
                  if (draftYearData[key] !== productionYearData[key]) {
                    hasRealChanges = true;
                    break;
                  }
                }
              }
            }

            if (Object.keys(productionYearData).length > 0) {
              set({
                draftSchedule: scheduleToEdit,
                originalSchedule: { ...productionYearData },  // ✅ Всегда production!
                employeeIds: productionData.employeeIds,
                employeeById: productionData.employeeById || {},
                hasUnsavedChanges: hasRealChanges, // Только если есть реальные изменения
                undoStack: [],
                editingYear: year,
                editingDepartmentId: departmentId
              });

              if (draftYearData) {
                console.log(`✅ Draft инициализирован с сохранёнными изменениями (hasUnsavedChanges: ${hasRealChanges})`);
              } else {
                console.log(`✅ Draft инициализирован из production (hasUnsavedChanges: false)`);
              }

              // Warming: делаем реальное изменение значения и откатываем
              requestAnimationFrame(() => {
                const keys = Object.keys(scheduleToEdit);
                if (keys.length > 0) {
                  const firstKey = keys[0];
                  const originalValue = scheduleToEdit[firstKey];
                  set(state => ({
                    draftSchedule: { ...state.draftSchedule, [firstKey]: '__warming__' }
                  }));
                  set(state => ({
                      draftSchedule: { ...state.draftSchedule, [firstKey]: originalValue },
                      hasUnsavedChanges: hasRealChanges // Сохраняем статус на основе реальных изменений
                    }));
                }
              });
            } else {
              // Год не существует — создаём пустой
              console.log(`📝 Создание пустого draft для ${year}`);
              get().createEmptyYear(year, productionData.employeeIds, productionData.employeeById || {}, departmentId);
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
        createEmptyYear: (year, employeeIds, employeeById, departmentId) => {
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
            editingDepartmentId: departmentId
          });

          console.log(`✅ Создан пустой год ${year} с ${Object.keys(emptyDraft).length} ячейками (включая Q1 ${year + 1})`);

          // Warming: делаем реальное изменение значения и откатываем
          requestAnimationFrame(() => {
            const keys = Object.keys(emptyDraft);
            if (keys.length > 0) {
              const firstKey = keys[0];
              const originalValue = emptyDraft[firstKey];
              set(state => ({
                draftSchedule: { ...state.draftSchedule, [firstKey]: '__warming__' }
              }));
              set(state => ({
                      draftSchedule: { ...state.draftSchedule, [firstKey]: originalValue },
                      hasUnsavedChanges: false // сбрасываем флаг изменений
                    }));
            }
          });
        },

        // Обновить одну ячейку в draft
        updateDraftCell: (employeeId, date, status) => {
          const key = `${employeeId}-${date}`;

          set(state => ({
            draftSchedule: {
              ...state.draftSchedule,
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
            hasUnsavedChanges: true
          }));
        },

        // Сохранить состояние для undo
        saveUndoState: () => {
          const { draftSchedule, undoStack } = get();
          set({
            undoStack: [...undoStack, { ...draftSchedule }]
          });
        },

        // Отменить последнее действие (Ctrl+Z)
        undo: () => {
          const { undoStack } = get();
          if (undoStack.length === 0) return false;

          const previousState = undoStack[undoStack.length - 1];
          set({
            draftSchedule: previousState,
            undoStack: undoStack.slice(0, -1),
            hasUnsavedChanges: true
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
         * Обновить список сотрудников (при изменении настроек отдела)
         * Обновляет напрямую без перезагрузки всего draft
         * @param {Array<string>} newEmployeeIds - новый массив ID сотрудников
         * @param {Object} newEmployeeById - новый объект с данными сотрудников
         */
        updateEmployees: (newEmployeeIds, newEmployeeById) => {
          console.log(`📝 Обновление сотрудников: ${newEmployeeIds.length} человек`);

          set({
            employeeIds: newEmployeeIds,
            employeeById: newEmployeeById
          });

          console.log('✅ Список сотрудников обновлен в adminStore');
        },

        /**
         * Сохранить draft в localStorage (без публикации в production)
         * Сохраняет черновик для работы между админами
         */
        saveDraftToStorage: async () => {
          const { draftSchedule, employeeIds, employeeById, editingDepartmentId, editingYear } = get();

          if (!editingDepartmentId || !editingYear) {
            console.error('Нет активного draft для сохранения');
            return false;
          }

          try {
            // Сохраняем через postWebStore
            const postStore = usePostWebStore.getState();
            await postStore.saveDraft(editingDepartmentId, editingYear, {
              draftSchedule,
              employeeIds,
              employeeById
            });

            // Обновляем timestamp последнего сохранения
            set({
              lastDraftSaved: new Date().toISOString()
            });

            console.log(`💾 Черновик сохранен: ${editingDepartmentId}/${editingYear}`);
            return true;

          } catch (error) {
            console.error('Failed to save draft:', error);
            throw error;
          }
        },

        /**
         * Опубликовать draft → production
         * Отправляет изменения на сервер и обновляет scheduleStore
         */
        publishDraft: async () => {
          const { draftSchedule, originalSchedule, editingDepartmentId, editingYear } = get();

          // Вычисляем только изменённые ячейки
          const changes = {};
          Object.entries(draftSchedule).forEach(([key, value]) => {
            if (originalSchedule[key] !== value) {
              changes[key] = value;
            }
          });

          if (Object.keys(changes).length === 0) {
            console.log('ℹ️ Нет изменений для публикации');
            return 0;
          }

          try {
            // Отправляем на сервер через postWebStore
            const postStore = usePostWebStore.getState();
            await postStore.publishSchedule(editingDepartmentId, editingYear, changes);

            // Применяем изменения в production (scheduleStore)
            const scheduleStore = useScheduleStore.getState();
            const changedCount = scheduleStore.applyChanges(changes);

            // Обновляем originalSchedule (теперь draft = production)
            set({
              originalSchedule: { ...draftSchedule },
              hasUnsavedChanges: false,
              undoStack: []
            });

            console.log(`✅ Опубликовано ${changedCount} изменений`);
            return changedCount;

          } catch (error) {
            console.error('Failed to publish:', error);
            throw error;
          }
        },

        // Отменить все изменения — вернуть draft к original
        discardDraft: () => {
          const { originalSchedule } = get();
          set({
            draftSchedule: { ...originalSchedule },
            hasUnsavedChanges: false,
            undoStack: []
          });
        },

        // Очистить draft данные (при переключении контекста, но остаться в админ режиме)
        clearDraftData: () => {
          set({
            draftSchedule: {},
            originalSchedule: {},
            employeeIds: [],
            employeeById: {},
            hasUnsavedChanges: false,
            undoStack: [],
            yearVersions: [],
            selectedVersion: null
          });
        },

        // Очистить draft и выйти из режима редактирования
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
            selectedVersion: null
          });
        },

        /**
         * Установить контекст редактирования (отдел и год)
         * Используется при переключении отделов в админ режиме
         * @param {string} departmentId
         * @param {number} year
         */
        setEditingContext: async (departmentId, year) => {
          console.log(`📋 Установка контекста редактирования: ${departmentId}/${year}`);

          // Очистить предыдущий draft
          set({
            draftSchedule: {},
            originalSchedule: {},
            employeeIds: [],
            employeeById: {},
            hasUnsavedChanges: false,
            undoStack: [],
            yearVersions: [],
            selectedVersion: null
          });

          // Установить новый контекст
          set({
            editingDepartmentId: departmentId,
            editingYear: year
          });

          // Обновить dateAdminStore для нового года
          useDateAdminStore.getState().initializeYear(Number(year));

          // Загрузить доступные годы
          await get().loadAvailableYears(departmentId);

          // Загрузить draft для этого года
          await get().initializeDraft(departmentId, Number(year));

          // Загрузить версии
          await get().loadYearVersions(departmentId, year);
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

        /**
         * Загрузить версии для выбранного года
         * @param {string} departmentId
         * @param {number|string} year
         */
        loadYearVersions: async (departmentId, year) => {
          set({ loadingVersions: true, yearVersions: [] });

          try {
            const fetchStore = useFetchWebStore.getState();
            const data = await fetchStore.fetchYearVersions(departmentId, year);

            set({
              yearVersions: data.versions || [],
              loadingVersions: false
            });

            return data.versions;
          } catch (error) {
            console.error('loadYearVersions error:', error);
            set({ loadingVersions: false });
            throw error;
          }
        },

        /**
         * Переключить год (загрузить draft для другого года)
         * @param {number|string} year
         */
        switchYear: async (year) => {
          const { editingDepartmentId } = get();
          if (!editingDepartmentId) return;

          // Сбросить выбранную версию
          set({ selectedVersion: null, yearVersions: [] });

          // Обновить dateAdminStore для нового года (важно сделать до загрузки данных)
          useDateAdminStore.getState().initializeYear(Number(year));

          // Загрузить draft для нового года
          await get().initializeDraft(editingDepartmentId, Number(year));

          // Загрузить версии для этого года
          await get().loadYearVersions(editingDepartmentId, year);
        },

        /**
         * Создать новый год
         * @param {number} year - год для создания
         */
        createNewYear: async (year) => {
          let { editingDepartmentId, employeeIds, employeeById } = get();

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
                employeeById = employees.employeeById;
                console.log(`✅ Загружено ${employeeIds.length} сотрудников`);
              } catch (error) {
                console.error('Не удалось загрузить список сотрудников:', error);
                alert('Не удалось загрузить список сотрудников. Создайте сначала любой существующий год.');
                return;
              }
            }

            // Создать структуру данных в формате JSON
            const scheduleData = {
              users_id: employeeIds.join(','),
              data: employeeIds.map(empId => {
                const employee = employeeById[empId];
                const schedule = {};

                // Генерируем пустые ячейки для всего года
                const startDate = new Date(year, 0, 1);
                const endDate = new Date(year, 11, 31);

                const currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                  const monthDay = String(currentDate.getMonth() + 1).padStart(2, '0') + '-' +
                                   String(currentDate.getDate()).padStart(2, '0');
                  schedule[monthDay] = '';  // Пустая ячейка
                  currentDate.setDate(currentDate.getDate() + 1);
                }

                // Добавляем Q1 следующего года для offset таблицы
                const nextYearStart = new Date(year + 1, 0, 1);
                const nextYearEnd = new Date(year + 1, 2, 31); // конец марта

                const nextYearDate = new Date(nextYearStart);
                while (nextYearDate <= nextYearEnd) {
                  const monthDay = String(nextYearDate.getMonth() + 1).padStart(2, '0') + '-' +
                                   String(nextYearDate.getDate()).padStart(2, '0');
                  schedule[monthDay] = '';  // Пустая ячейка
                  nextYearDate.setDate(nextYearDate.getDate() + 1);
                }

                // Разбираем fullName обратно на части (если возможно)
                const fullNameParts = employee.fullName.split(' ');
                const fio = {
                  family: fullNameParts[0] || '',
                  name1: fullNameParts[1] || '',
                  name2: fullNameParts[2] || ''
                };

                return {
                  id: Number(empId),
                  fio,
                  position: employee.position || '',
                  schedule
                };
              })
            };

            // Сохранить в localStorage через postWebStore
            const postStore = usePostWebStore.getState();
            await postStore.createScheduleYear(editingDepartmentId, year, scheduleData);

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

            console.log(`✅ Новый год ${year} создан в localStorage с ${employeeIds.length} сотрудниками`);

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
          const { editingDepartmentId, editingYear } = get();
          if (!editingDepartmentId || !editingYear) return;

          try {
            const fetchStore = useFetchWebStore.getState();
            const data = await fetchStore.fetchVersionSchedule(
              editingDepartmentId,
              editingYear,
              version
            );

            // Загружаем версию как draft (только для просмотра)
            set({
              draftSchedule: { ...data.scheduleMap },
              originalSchedule: { ...data.scheduleMap },
              employeeIds: data.employeeIds,
              employeeById: data.employeeById,
              selectedVersion: version,
              hasUnsavedChanges: false,
              undoStack: []
            });

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

          set({ selectedVersion: null });
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
    ),
    { name: 'AdminStore' }
  )
);

export default useAdminStore;
