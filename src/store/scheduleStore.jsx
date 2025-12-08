import {create} from 'zustand';
import { devtools } from 'zustand/middleware';

// import { normalizeSchedule } from '../utils/normalize'

export const useScheduleStore = create(
  devtools((set, get) => ({
    // === STATE ===
    scheduleMap: {},               // { "emp-1-2025-01-15": "Д", ... }
    employeeMap: [],
    changedCells: new Set(),       // Подсветка изменённых ячеек
    loading: false,

    // Кэширование загруженных годов
    // Структура: { "departmentId-year": { scheduleMap, employeeMap } }
    cachedYears: {},
    loadedYear: null,              // Текущий загруженный год
    loadedDepartment: null,        // Текущий загруженный отдел

    // WebSocket
    ws: null,
    isConnected: false,
    
    // === ACTIONS ===
    
    // Загрузка расписания с кэшированием
    loadSchedule: async (departmentId, year) => {
      const cacheKey = `${departmentId}-${year}`;
      const { cachedYears, loadedYear, loadedDepartment } = get();

      // Проверяем, уже загружен ли этот год для этого отдела
      if (loadedDepartment === departmentId && loadedYear === year) {
        console.log(`📦 Год ${year} для отдела ${departmentId} уже загружен`);
        return; // Уже загружено
      }

      // Проверяем кэш
      if (cachedYears[cacheKey]) {
        console.log(`🔄 Восстановление из кэша: ${cacheKey}`);
        const cached = cachedYears[cacheKey];

        set({
          scheduleMap: cached.scheduleMap,
          employeeMap: cached.employeeMap,
          loadedYear: year,
          loadedDepartment: departmentId,
          loading: false
        });

        return;
      }

      // Загружаем с сервера
      console.log(`🌐 Загрузка с сервера: ${cacheKey}`);
      set({ loading: true });

      try {
        const response = await fetch(
          `../../public/data-${departmentId}-${year}.json`
        );
        const data = await response.json();
        const { employeeMap, scheduleMap } = get().normalizeScheduleData(data, year);

        // Сохраняем в кэш
        set(state => ({
          scheduleMap: scheduleMap || {},
          employeeMap: employeeMap || {},
          loadedYear: year,
          loadedDepartment: departmentId,
          cachedYears: {
            ...state.cachedYears,
            [cacheKey]: { scheduleMap, employeeMap }
          },
          loading: false
        }));

        console.log(`✅ Данные загружены и закэшированы: ${cacheKey}`);
        console.log(employeeMap);
        console.log(scheduleMap);

      } catch (error) {
        console.error('Failed to load schedule:', error);
        set({ loading: false });
      }
    },
    
    // Нормализация данных с сервера
    normalizeScheduleData: (rawData, year) => {
      const employeeMap = [];
      const scheduleMap = {};
      
      rawData.data.forEach(employee => {
        const employeeId = String(employee.id);
        
        // Формируем employeeMap
        employeeMap.push({
          id: employeeId,
          name: `${employee.fio.family} ${employee.fio.name1[0]}.${employee.fio.name2[0]}.`,
          fullName: `${employee.fio.family} ${employee.fio.name1} ${employee.fio.name2}`,
          position: employee.position || '' // если есть
        });
        
        // Формируем scheduleMap
        Object.entries(employee.schedule).forEach(([dateKey, status]) => {
          // dateKey приходит как "01-01", преобразуем в "2025-01-01"
          const fullDate = `${year}-${dateKey}`;
          const key = `${employeeId}-${fullDate}`;
          scheduleMap[key] = status;
        });
      });
      
      return { employeeMap, scheduleMap };
    },
    
    // Получить данные сотрудника
    getEmployee: (employeeId) => {
      return get().employeeMap[employeeId] || null;
    },
    
    // Получить всех сотрудников (для рендера таблицы)
    getAllEmployees: () => {
      return Object.values(get().employeeMap);
    },
    
    // Получить статус ячейки
    getCellStatus: (employeeId, date) => {
      const key = `${employeeId}-${date}`;
      return get().scheduleMap[key] || '';
    },
    
    // Проверить, изменена ли ячейка
    isCellChanged: (employeeId, date) => {
      const key = `${employeeId}-${date}`;
      return get().changedCells.has(key);
    },
    
    // Очистить расписание (но сохранить кэш)
    clearSchedule: () => {
      set({
        employeeMap: {},
        scheduleMap: {},
        changedCells: new Set(),
        loadedYear: null,
        loadedDepartment: null
      });
    },

    // Полностью очистить кэш (при смене отдела или выходе)
    clearCache: () => {
      set({
        employeeMap: {},
        scheduleMap: {},
        changedCells: new Set(),
        cachedYears: {},
        loadedYear: null,
        loadedDepartment: null
      });
    },
    
    // === WEBSOCKET ===
    
    // connectWebSocket: () => {
    //   const ws = new WebSocket('ws://your-server.com/ws');
      
    //   ws.onopen = () => {
    //     console.log('WebSocket connected');
    //     set({ isConnected: true });
    //   };
      
    //   ws.onmessage = (event) => {
    //     const message = JSON.parse(event.data);
    //     get().handleWebSocketMessage(message);
    //   };
      
    //   ws.onclose = () => {
    //     console.log('WebSocket disconnected');
    //     set({ isConnected: false });
        
    //     setTimeout(() => {
    //       get().connectWebSocket();
    //     }, 5000);
    //   };
      
    //   ws.onerror = (error) => {
    //     console.error('WebSocket error:', error);
    //   };
      
    //   set({ ws });
    // },
    
    // disconnectWebSocket: () => {
    //   const { ws } = get();
    //   if (ws) {
    //     ws.close();
    //     set({ ws: null, isConnected: false });
    //   }
    // },
    
    // subscribeToUpdates: (departmentId) => {
    //   const { ws, isConnected } = get();
      
    //   if (!ws || !isConnected) {
    //     get().connectWebSocket();
    //     setTimeout(() => {
    //       get().subscribeToUpdates(departmentId);
    //     }, 1000);
    //     return;
    //   }
      
    //   ws.send(JSON.stringify({
    //     type: 'subscribe',
    //     departmentId: departmentId
    //   }));
    // },
    
    // unsubscribeFromUpdates: (departmentId) => {
    //   const { ws, isConnected } = get();
      
    //   if (ws && isConnected) {
    //     ws.send(JSON.stringify({
    //       type: 'unsubscribe',
    //       departmentId: departmentId
    //     }));
    //   }
    // },
    
    // handleWebSocketMessage: (message) => {
    //   switch (message.type) {
    //     case 'schedule_published':
    //       get().handlePublishUpdate(message.data);
    //       break;
          
    //     case 'department_config_updated':
    //       useMetaStore.getState().updateDepartmentConfig(message.data);
    //       break;
          
    //     default:
    //       console.log('Unknown message type:', message.type);
    //   }
    // },
    
    // handlePublishUpdate: (update) => {
    //   const { changes, departmentId, publishedBy, publishedAt } = update;
    //   // changes: { "1000-2025-01-15": "Д", "1001-2025-01-15": "В" }
      
    //   const currentDepartmentId = useWorkspaceStore.getState().currentDepartmentId;
    //   if (departmentId !== currentDepartmentId) {
    //     return;
    //   }
      
    //   set(state => ({
    //     scheduleMap: {
    //       ...state.scheduleMap,
    //       ...changes
    //     },
    //     changedCells: new Set(Object.keys(changes))
    //   }));
      
    //   console.log(`Расписание обновлено пользователем ${publishedBy} в ${publishedAt}`);
      
    //   setTimeout(() => {
    //     set({ changedCells: new Set() });
    //   }, 5000);
    // }
  }), { name: 'ScheduleStore' })
);