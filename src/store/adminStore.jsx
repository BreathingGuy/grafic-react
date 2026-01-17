import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useFetchWebStore } from './fetchWebStore';
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

        // === DRAFT STATE ===
        draftSchedule: {},             // Рабочая копия: { "empId-date": "status" }
        originalSchedule: {},          // Исходное состояние (для сравнения)
        employeeIds: [],               // Список ID сотрудников
        employeeById: {},              // Данные сотрудников: { id: { id, name, fullName, position } }
        hasUnsavedChanges: false,
        undoStack: [],                 // Для Ctrl+Z

        // Текущий редактируемый год и отдел
        editingYear: null,
        editingDepartmentId: null,

        // === YEARS & VERSIONS ===
        availableYears: [],            // Доступные года для отдела: ["2024", "2025", "2026"]
        yearVersions: [],              // Версии выбранного года: ["2025.02.15", "2025.03.16", ...]
        selectedVersion: null,         // Выбранная версия (null = текущий draft)
        loadingYears: false,
        loadingVersions: false,

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

          try {
            const fetchStore = useFetchWebStore.getState();
            // Загружаем как draft (в будущем может быть отдельный endpoint)
            const { employeeIds, employeeById, scheduleMap } = await fetchStore.fetchSchedule(
              departmentId,
              year,
              { mode: 'draft' }
            );

            // Фильтруем только нужный год
            const yearPrefix = `${year}-`;
            const yearData = {};
            Object.entries(scheduleMap).forEach(([key, value]) => {
              if (key.includes(yearPrefix)) {
                yearData[key] = value;
              }
            });

            if (Object.keys(yearData).length > 0) {
              // Год существует — копируем
              set({
                draftSchedule: { ...yearData },
                originalSchedule: { ...yearData },
                employeeIds: employeeIds,
                employeeById: employeeById || {},
                hasUnsavedChanges: false,
                undoStack: [],
                editingYear: year,
                editingDepartmentId: departmentId
              });
              console.log(`✅ Draft инициализирован: ${Object.keys(yearData).length} ячеек`);

              // Warming: делаем реальное изменение значения и откатываем
              // Это заставляет React полностью инициализировать reconciliation
              requestAnimationFrame(() => {
                const keys = Object.keys(yearData);
                if (keys.length > 0) {
                  const firstKey = keys[0];
                  const originalValue = yearData[firstKey];
                  // Меняем на временное значение
                  set(state => ({
                    draftSchedule: { ...state.draftSchedule, [firstKey]: '__warming__' }
                  }));
                  set(state => ({
                      draftSchedule: { ...state.draftSchedule, [firstKey]: originalValue },
                      hasUnsavedChanges: false // сбрасываем флаг изменений
                    }));
                }
              });
            } else {
              // Год не существует — создаём пустой
              console.log(`📝 Создание пустого draft для ${year}`);
              get().createEmptyYear(year, employeeIds, employeeById || {}, departmentId);
            }

          } catch (error) {
            console.error('Failed to initialize draft:', error);
            // Создаём пустой draft если загрузка не удалась
            get().createEmptyYear(year, [], {}, departmentId);
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

          console.log(`✅ Создан пустой год ${year} с ${Object.keys(emptyDraft).length} ячейками`);

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
         * Опубликовать draft → production
         * Отправляет изменения на сервер и обновляет scheduleStore
         */
        publishDraft: async () => {
          const { draftSchedule, originalSchedule, editingDepartmentId } = get();

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
            // Отправляем на сервер через fetchWebStore
            const fetchStore = useFetchWebStore.getState();
            await fetchStore.publishSchedule(editingDepartmentId, changes);

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
            yearVersions: [],
            selectedVersion: null
          });
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
