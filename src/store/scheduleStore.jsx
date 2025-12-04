import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useScheduleStore = create(
  devtools((set, get) => ({
    // === STATE ===
    scheduleMap: {},           // Production расписание
    draftSchedule: {},         // Черновик (для админа)
    changedCells: new Set(),   // Подсветка после публикации
    // lastPublished: null,       // {date, adminName, department}
    loading: false,
    
    // === ACTIONS ===
    
    // Загрузка production расписания
    loadSchedule: (scheduleMap) => {
      set({ scheduleMap, loading: false });
    },
    
    // Загрузка черновика (для админа)
    loadDraft: (draftSchedule) => {
      set({ draftSchedule });
    },
    
    // Обновление ячейки в черновике
    updateCell: (employeeId, date, status) => {
      const key = `${employeeId}-${date}`;
      set(state => ({
        draftSchedule: {
          ...state.draftSchedule,
          [key]: status
        }
      }));
      
      // Помечаем что есть несохранённые изменения
      useAdminStore.getState().setHasUnsavedChanges(true);
    },
    
    // Сохранение черновика на сервер
    saveDraft: async () => {
      const { draftSchedule } = get();
      const department = useAdminStore.getState().department;
      
      // Отправляем на сервер
      // await api.saveDraft(department, draftSchedule);
      
      useAdminStore.getState().setHasUnsavedChanges(false);
    },
    
    // Публикация черновика
    publishDraft: async () => {
      const { draftSchedule } = get();
      const department = useAdminStore.getState().department;
      
      // Отправляем на сервер
      // const response = await api.publishDraft(department, draftSchedule);
      
      // Обновляем production
      set(state => ({
        scheduleMap: {
          ...state.scheduleMap,
          ...draftSchedule
        }
      }));
      
      // Помечаем изменённые ячейки
      const changedKeys = Object.keys(draftSchedule).filter(key => 
        draftSchedule[key] !== state.scheduleMap[key]
      );
      set({ changedCells: new Set(changedKeys) });
      
      // Сбрасываем подсветку через 5 секунд
    //   setTimeout(() => {
    //     set({ changedCells: new Set() });
    //   }, 5000);
      
      useAdminStore.getState().setHasUnsavedChanges(false);
    },
    
    // WebSocket: обновление от сервера
    handlePublishUpdate: (update) => {
      const { changes, publishedBy, publishedAt, department } = update;
      
      set(state => ({
        scheduleMap: {
          ...state.scheduleMap,
          ...changes
        },
        changedCells: new Set(Object.keys(changes)),
        lastPublished: { date: publishedAt, adminName: publishedBy, department }
      }));
      
      // Сбрасываем подсветку через 5 секунд
      setTimeout(() => {
        set({ changedCells: new Set() });
      }, 5000);
    }
  }), { name: 'ScheduleStore' })
);