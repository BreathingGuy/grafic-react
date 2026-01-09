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

        // === THREE-LEVEL DATA MODEL ===
        // Level 1: Local Changes (unsaved edits in this browser session)
        localChanges: {},              // { "empId-date": "status" } - локальные изменения

        // Level 2: Shared Draft (synced between all admins via server)
        sharedDraft: {},               // { "empId-date": "status" } - общий драфт с сервера

        // Level 3: Production - хранится в scheduleStore.scheduleMap

        // === DRAFT STATE ===
        draftSchedule: {},             // Объединённое представление: sharedDraft + localChanges
        hasLocalChanges: false,        // Есть несохранённые локальные изменения
        hasUnsavedChanges: false,      // Для обратной совместимости (= hasLocalChanges)
        undoStack: [],                 // Для Ctrl+Z

        // Флаг: драфт на сервере отличается от production
        draftDiffersFromProduction: false,

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
            sharedDraft: {},
            localChanges: {},
            draftSchedule: {},
            hasLocalChanges: false,
            hasUnsavedChanges: false,
            draftDiffersFromProduction: false,
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

        // Инициализировать draft — загружает shared draft с сервера или создаёт из production
        initializeDraft: async (year) => {
          const scheduleStore = useScheduleStore.getState();
          const { scheduleMap, employeeIds } = scheduleStore;
          const yearPrefix = `${year}-`;

          // TODO: Загрузить shared draft с сервера
          // const response = await api.get(`/api/admin/draft/${year}`);
          // const serverDraft = response.data.draft;

          // Временно: проверяем есть ли данные в production
          const yearData = {};
          Object.entries(scheduleMap).forEach(([key, value]) => {
            if (key.includes(yearPrefix)) {
              yearData[key] = value;
            }
          });

          if (Object.keys(yearData).length > 0) {
            // Год существует в production — инициализируем shared draft из него
            console.log(`📋 Инициализация shared draft из production для ${year}`);
            set({
              sharedDraft: { ...yearData },
              localChanges: {},
              draftSchedule: { ...yearData },
              hasLocalChanges: false,
              hasUnsavedChanges: false,
              draftDiffersFromProduction: false,
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
            sharedDraft: emptyDraft,
            localChanges: {},
            draftSchedule: emptyDraft,
            hasLocalChanges: false,
            hasUnsavedChanges: false,
            draftDiffersFromProduction: true, // Новый год отличается от production
            undoStack: [],
            editingYear: year
          });

          console.log(`✅ Создан пустой год ${year} с ${Object.keys(emptyDraft).length} ячейками`);
        },

        // Обновить одну ячейку в draft (записывает в localChanges)
        updateDraftCell: (employeeId, date, status) => {
          const key = `${employeeId}-${date}`;

          set(state => {
            const newLocalChanges = {
              ...state.localChanges,
              [key]: status
            };

            // Объединяем sharedDraft + localChanges → draftSchedule
            return {
              localChanges: newLocalChanges,
              draftSchedule: {
                ...state.sharedDraft,
                ...newLocalChanges
              },
              hasLocalChanges: true,
              hasUnsavedChanges: true
            };
          });
        },

        // Массовое обновление ячеек (для вставки)
        batchUpdateDraftCells: (updates) => {
          set(state => {
            const newLocalChanges = {
              ...state.localChanges,
              ...updates
            };

            // Объединяем sharedDraft + localChanges → draftSchedule
            return {
              localChanges: newLocalChanges,
              draftSchedule: {
                ...state.sharedDraft,
                ...newLocalChanges
              },
              hasLocalChanges: true,
              hasUnsavedChanges: true
            };
          });
        },

        // Сохранить состояние для undo
        saveUndoState: () => {
          const { localChanges, undoStack } = get();
          set({
            undoStack: [...undoStack, { ...localChanges }]
          });
        },

        // Отменить последнее действие (Ctrl+Z)
        undo: () => {
          const { undoStack, sharedDraft } = get();
          if (undoStack.length === 0) return false;

          const previousLocalChanges = undoStack[undoStack.length - 1];
          const hasChanges = Object.keys(previousLocalChanges).length > 0;

          set({
            localChanges: previousLocalChanges,
            draftSchedule: {
              ...sharedDraft,
              ...previousLocalChanges
            },
            undoStack: undoStack.slice(0, -1),
            hasLocalChanges: hasChanges,
            hasUnsavedChanges: hasChanges
          });

          return true;
        },

        // Восстановить draft (альтернатива undo для полного восстановления)
        restoreDraftSchedule: (previousDraft) => {
          const { sharedDraft } = get();
          // Вычисляем localChanges как разницу между previousDraft и sharedDraft
          const localChanges = {};
          Object.entries(previousDraft).forEach(([key, value]) => {
            if (sharedDraft[key] !== value) {
              localChanges[key] = value;
            }
          });

          set({
            localChanges,
            draftSchedule: previousDraft,
            hasLocalChanges: Object.keys(localChanges).length > 0,
            hasUnsavedChanges: Object.keys(localChanges).length > 0
          });
        },

        // === SAVE DRAFT (Local → Shared Draft) ===
        // Сохраняет локальные изменения в общий драфт (синхронизация между админами)
        saveDraft: async () => {
          const { localChanges, sharedDraft, editingYear } = get();

          if (Object.keys(localChanges).length === 0) {
            console.log('ℹ️ Нет локальных изменений для сохранения');
            return 0;
          }

          // TODO: Отправить на сервер
          // await api.post('/api/admin/draft/save', {
          //   year: editingYear,
          //   changes: localChanges
          // });

          // Объединяем localChanges в sharedDraft
          const newSharedDraft = {
            ...sharedDraft,
            ...localChanges
          };

          const changedCount = Object.keys(localChanges).length;

          set({
            sharedDraft: newSharedDraft,
            localChanges: {},
            draftSchedule: newSharedDraft,
            hasLocalChanges: false,
            hasUnsavedChanges: false,
            draftDiffersFromProduction: true,
            undoStack: [] // Очищаем undo после сохранения
          });

          console.log(`💾 Сохранено в драфт: ${changedCount} изменений (год ${editingYear})`);
          return changedCount;
        },

        // === WEBSOCKET: Обработка обновления драфта от другого админа ===
        onDraftUpdated: (incomingChanges, fromUserId) => {
          const { sharedDraft, localChanges, user } = get();

          // Игнорируем свои собственные изменения
          if (user && fromUserId === user.userId) {
            return;
          }

          console.log(`📥 Получены изменения драфта от админа ${fromUserId}`);

          // Обновляем sharedDraft
          const newSharedDraft = {
            ...sharedDraft,
            ...incomingChanges
          };

          // Проверяем конфликты с локальными изменениями
          const conflicts = [];
          Object.keys(incomingChanges).forEach(key => {
            if (localChanges[key] !== undefined && localChanges[key] !== incomingChanges[key]) {
              conflicts.push(key);
            }
          });

          if (conflicts.length > 0) {
            console.warn(`⚠️ Конфликты с локальными изменениями: ${conflicts.length} ячеек`);
            // Локальные изменения имеют приоритет (пользователь сам решит)
          }

          // Объединяем: sharedDraft + localChanges (локальные имеют приоритет)
          set({
            sharedDraft: newSharedDraft,
            draftSchedule: {
              ...newSharedDraft,
              ...localChanges
            }
          });
        },

        // Получить количество конфликтов с входящими изменениями
        getConflicts: (incomingChanges) => {
          const { localChanges } = get();
          const conflicts = [];

          Object.keys(incomingChanges).forEach(key => {
            if (localChanges[key] !== undefined && localChanges[key] !== incomingChanges[key]) {
              conflicts.push({
                key,
                localValue: localChanges[key],
                incomingValue: incomingChanges[key]
              });
            }
          });

          return conflicts;
        },

        // === PUBLISH (Shared Draft → Production) ===
        // Публикует драфт в production (видимый всем пользователям)
        publishDraft: async () => {
          const { localChanges, editingYear } = get();
          const scheduleStore = useScheduleStore.getState();

          // Сначала сохраняем локальные изменения в shared draft
          if (Object.keys(localChanges).length > 0) {
            await get().saveDraft();
          }

          // Получаем актуальный sharedDraft после возможного saveDraft()
          const finalDraft = get().sharedDraft;

          // TODO: Отправить на сервер
          // await api.post('/api/admin/publish', {
          //   year: editingYear,
          //   schedule: finalDraft
          // });

          // Применяем изменения в production
          const changedCount = scheduleStore.applyChanges(finalDraft);

          // Сбрасываем флаг отличия от production
          set({
            draftDiffersFromProduction: false,
            undoStack: []
          });

          console.log(`✅ Опубликовано ${changedCount} изменений (год ${editingYear})`);
          return changedCount;
        },

        // Отменить локальные изменения — вернуть к shared draft
        discardLocalChanges: () => {
          const { sharedDraft } = get();
          set({
            localChanges: {},
            draftSchedule: { ...sharedDraft },
            hasLocalChanges: false,
            hasUnsavedChanges: false,
            undoStack: []
          });
          console.log('🔄 Локальные изменения отменены');
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
            sharedDraft: {},
            localChanges: {},
            draftSchedule: {},
            hasLocalChanges: false,
            hasUnsavedChanges: false,
            draftDiffersFromProduction: false,
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

        // Проверить, есть ли локальное изменение для ячейки
        hasCellLocalChange: (employeeId, date) => {
          const key = `${employeeId}-${date}`;
          return get().localChanges[key] !== undefined;
        },

        // Проверить, изменена ли ячейка относительно shared draft
        isCellModifiedFromDraft: (employeeId, date) => {
          const key = `${employeeId}-${date}`;
          const { localChanges, sharedDraft } = get();
          return localChanges[key] !== undefined && localChanges[key] !== sharedDraft[key];
        },

        // Проверить, изменена ли ячейка относительно production
        isCellModified: (employeeId, date) => {
          const key = `${employeeId}-${date}`;
          const { draftSchedule } = get();
          const productionValue = useScheduleStore.getState().scheduleMap[key];
          return draftSchedule[key] !== productionValue;
        },

        // Получить количество локальных изменений
        getLocalChangesCount: () => {
          return Object.keys(get().localChanges).length;
        },

        // Получить количество изменений в shared draft относительно production
        getDraftChangesCount: () => {
          const { sharedDraft } = get();
          const { scheduleMap } = useScheduleStore.getState();
          let count = 0;

          Object.entries(sharedDraft).forEach(([key, value]) => {
            if (scheduleMap[key] !== value) {
              count++;
            }
          });

          return count;
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
