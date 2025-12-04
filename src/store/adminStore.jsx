import {create} from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export const useAdminStore = create(
  devtools(
    persist(
      (set, get) => ({
        // === STATE ===
        isAuthenticated: false,
        user: null,                    // { userId, email, name, token }
        ownedDepartments: [],          // ["dept-1"]
        editableDepartments: [],       // ["dept-1", "dept-2"]
        
        // Режим редактирования
        editMode: false,
        draftSchedule: {},             // Черновик изменений
        changedCells: new Set(),       // Подсветка после публикации
        hasUnsavedChanges: false,
        
        // === ACTIONS ===
        
        // Вход
        login: async (email, password) => {
          // const response = await api.post('/api/auth/login', { email, password });
          
          set({
            isAuthenticated: true,
            user: {
              userId: response.userId,
              email: response.email,
              name: response.name,
              token: response.token
            },
            ownedDepartments: response.ownedDepartments,
            editableDepartments: response.editableDepartments
          });
        },
        
        // Выход
        logout: () => {
          set({
            isAuthenticated: false,
            user: null,
            ownedDepartments: [],
            editableDepartments: [],
            editMode: false,
            draftSchedule: {},
            changedCells: new Set(),
            hasUnsavedChanges: false
          });
        },
        
        // Проверка прав на редактирование отдела
        canEditDepartment: (departmentId) => {
          return get().editableDepartments.includes(departmentId);
        },
        
        // Проверка прав владельца
        isOwner: (departmentId) => {
          return get().ownedDepartments.includes(departmentId);
        },
        
        // Включить режим редактирования
        enableEditMode: async (departmentId) => {
          // Загружаем черновик
          // const response = await api.get(
          //   `/api/admin/departments/${departmentId}/draft?year=2025`,
          //   { headers: { Authorization: `Bearer ${get().user.token}` } }
          // );
          
          set({
            editMode: true,
            draftSchedule: response.draftSchedule || {}
          });
        },
        
        // Выключить режим редактирования
        disableEditMode: () => {
          if (get().hasUnsavedChanges) {
            const confirm = window.confirm('Есть несохранённые изменения. Выйти?');
            if (!confirm) return;
          }
          
          set({
            editMode: false,
            draftSchedule: {},
            hasUnsavedChanges: false
          });
        },
        
        // Обновить ячейку в черновике
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
        
        // Сохранить черновик
        saveDraft: async (departmentId) => {
          const { draftSchedule, user } = get();
          
          // await api.post(
          //   `/api/admin/departments/${departmentId}/draft/save`,
          //   { draftSchedule },
          //   { headers: { Authorization: `Bearer ${user.token}` } }
          // );
          
          set({ hasUnsavedChanges: false });
        },
        
        // Опубликовать черновик
        publishDraft: async (departmentId) => {
          const { draftSchedule, user } = get();
          
          // await api.post(
          //   `/api/admin/departments/${departmentId}/draft/publish`,
          //   { draftSchedule },
          //   { headers: { Authorization: `Bearer ${user.token}` } }
          // );
          
          // Обновляем production расписание
          const scheduleStore = useScheduleStore.getState();
          scheduleStore.set(state => ({
            scheduleMap: {
              ...state.scheduleMap,
              ...draftSchedule
            }
          }));
          
          // Помечаем изменённые ячейки
          const changedKeys = Object.keys(draftSchedule).filter(key =>
            draftSchedule[key] !== scheduleStore.scheduleMap[key]
          );
          
          set({
            changedCells: new Set(changedKeys),
            draftSchedule: {},
            hasUnsavedChanges: false
          });
          
          // Сбрасываем подсветку через 5 секунд
          setTimeout(() => {
            set({ changedCells: new Set() });
          }, 5000);
        },
        
        // WebSocket: обновление от другого админа
        handlePublishUpdate: (update) => {
          const { changes, departmentId } = update;
          
          // Обновляем production
          const scheduleStore = useScheduleStore.getState();
          scheduleStore.set(state => ({
            scheduleMap: {
              ...state.scheduleMap,
              ...changes
            }
          }));
          
          // Подсветка
          set({ changedCells: new Set(Object.keys(changes)) });
          
          setTimeout(() => {
            set({ changedCells: new Set() });
          }, 5000);
        }
      }),
      {
        name: 'admin-storage', // имя в localStorage
        partialize: (state) => ({
          // Сохраняем только токен и базовую инфу
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          ownedDepartments: state.ownedDepartments,
          editableDepartments: state.editableDepartments
        })
      }
    ),
    { name: 'AdminStore' }
  )
);

export default useAdminStore;