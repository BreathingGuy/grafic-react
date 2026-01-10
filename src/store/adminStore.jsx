import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useFetchWebStore } from './fetchWebStore';
import { useScheduleStore } from './scheduleStore';

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
        employeeIds: [],               // Список сотрудников для этого draft
        hasUnsavedChanges: false,
        undoStack: [],                 // Для Ctrl+Z

        // Текущий редактируемый год и отдел
        editingYear: null,
        editingDepartmentId: null,

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
            hasUnsavedChanges: false,
            undoStack: [],
            editingYear: null,
            editingDepartmentId: null
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

          try {
            const fetchStore = useFetchWebStore.getState();
            const { employeeIds, scheduleMap } = await fetchStore.fetchSchedule(departmentId, year);

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
                hasUnsavedChanges: false,
                undoStack: [],
                editingYear: year,
                editingDepartmentId: departmentId
              });
              console.log(`✅ Draft инициализирован: ${Object.keys(yearData).length} ячеек`);
            } else {
              // Год не существует — создаём пустой
              console.log(`📝 Создание пустого draft для ${year}`);
              get().createEmptyYear(year, employeeIds, departmentId);
            }

          } catch (error) {
            console.error('Failed to initialize draft:', error);
            // Создаём пустой draft если загрузка не удалась
            get().createEmptyYear(year, [], departmentId);
          }
        },

        // Создать пустой год
        createEmptyYear: (year, employeeIds, departmentId) => {
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
            hasUnsavedChanges: false,
            undoStack: [],
            editingYear: year,
            editingDepartmentId: departmentId
          });

          console.log(`✅ Создан пустой год ${year} с ${Object.keys(emptyDraft).length} ячейками`);
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
            hasUnsavedChanges: false,
            undoStack: [],
            editingYear: null,
            editingDepartmentId: null
          });
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
