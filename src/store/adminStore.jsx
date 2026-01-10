import {create} from 'zustand';
import { devtools, persist } from 'zustand/middleware';
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
        hasUnsavedChanges: false,
        undoStack: [],                 // Для Ctrl+Z

        // Текущий редактируемый год
        editingYear: null,

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
            hasUnsavedChanges: false,
            undoStack: [],
            editingYear: null
          });
        },

        canEditDepartment: (departmentId) => {
          return get().editableDepartments.includes(departmentId);
        },

        isOwner: (departmentId) => {
          return get().ownedDepartments.includes(departmentId);
        },

        // === DRAFT OPERATIONS ===

        // Инициализировать draft — копирует из production или создаёт пустой
        initializeDraft: (year) => {
          const scheduleStore = useScheduleStore.getState();
          const { scheduleMap, employeeIds } = scheduleStore;
          const yearPrefix = `${year}-`;

          // Фильтруем production по году
          const yearData = {};
          Object.entries(scheduleMap).forEach(([key, value]) => {
            if (key.includes(yearPrefix)) {
              yearData[key] = value;
            }
          });

          if (Object.keys(yearData).length > 0) {
            // Год существует — копируем из production
            console.log(`📋 Инициализация draft из production для ${year}`);
            set({
              draftSchedule: { ...yearData },
              hasUnsavedChanges: false,
              undoStack: [],
              editingYear: year
            });
          } else {
            // Год не существует — создаём пустой
            console.log(`📝 Создание пустого draft для ${year}`);
            get().createEmptyYear(year, employeeIds);
          }
        },

        // Создать пустой год
        createEmptyYear: (year, employeeIds) => {
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
            hasUnsavedChanges: false,
            undoStack: [],
            editingYear: year
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

        // Опубликовать draft → production
        publishDraft: async () => {
          const { draftSchedule } = get();
          const scheduleStore = useScheduleStore.getState();

          // TODO: Отправить на сервер
          // await api.post('/api/admin/publish', { changes: draftSchedule });

          // Применяем изменения в production
          const changedCount = scheduleStore.applyChanges(draftSchedule);

          // Очищаем undo стек, но оставляем draft синхронизированным
          set({
            hasUnsavedChanges: false,
            undoStack: []
          });

          console.log(`✅ Опубликовано ${changedCount} изменений`);
          return changedCount;
        },

        // Отменить все изменения — вернуть draft к production
        discardDraft: () => {
          const { editingYear } = get();
          if (editingYear) {
            get().initializeDraft(editingYear);
          }
        },

        // Очистить draft (при выходе из режима редактирования)
        clearDraft: () => {
          set({
            draftSchedule: {},
            hasUnsavedChanges: false,
            undoStack: [],
            editingYear: null
          });
        },

        // === GETTERS ===

        // Получить статус ячейки из draft
        getDraftCellStatus: (employeeId, date) => {
          const key = `${employeeId}-${date}`;
          return get().draftSchedule[key] ?? '';
        },

        // Проверить, изменена ли ячейка относительно production
        isCellModified: (employeeId, date) => {
          const key = `${employeeId}-${date}`;
          const { draftSchedule } = get();
          const productionValue = useScheduleStore.getState().scheduleMap[key];
          return draftSchedule[key] !== productionValue;
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