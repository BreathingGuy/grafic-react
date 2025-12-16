import {create} from 'zustand';
import { devtools } from 'zustand/middleware';

// import { normalizeSchedule } from '../utils/normalize'

export const useScheduleStore = create(
  devtools((set, get) => ({
    // === STATE ===
    scheduleMap: {},               // { "emp-1-2025-01-15": "Д", ... }

    // 🎯 ОПТИМИЗАЦИЯ: Изменена структура хранения сотрудников
    // Вместо массива используем объект для переиспользования ссылок
    employeeById: {},              // { "1": { id: "1", name: "Иванов И.И.", ... }, ... }
    employeeIds: [],               // ["1", "2", "3", ...] - порядок сотрудников

    changedCells: new Set(),       // Подсветка изменённых ячеек
    loading: false,

    // Кэширование загруженных годов
    // Структура: { "departmentId-year": { scheduleMap, employeeById, employeeIds } }
    cachedYears: {},
    loadedYear: null,              // Текущий загруженный год
    loadedDepartment: null,        // Текущий загруженный отдел
    loadingKey: null,              // Ключ текущей загрузки (для предотвращения дублей)

    // WebSocket
    ws: null,
    isConnected: false,

    // === ACTIONS ===

    // Загрузка расписания с кэшированием
    loadSchedule: async (departmentId, year) => {
      const cacheKey = `${departmentId}-${year}`;
      const { cachedYears, loadedYear, loadedDepartment, loadingKey } = get();

      // Проверяем, уже загружен ли этот год для этого отдела
      if (loadedDepartment === departmentId && loadedYear === year) {
        console.log(`📦 Год ${year} для отдела ${departmentId} уже загружен`);
        return; // Уже загружено
      }

      // Проверяем, идет ли уже загрузка этих же данных
      if (loadingKey === cacheKey) {
        console.log(`⏳ Загрузка ${cacheKey} уже выполняется, пропускаем дубликат`);
        return;
      }

      // Проверяем кэш
      if (cachedYears[cacheKey]) {
        console.log(`🔄 Восстановление из кэша: ${cacheKey}`);
        const cached = cachedYears[cacheKey];

        // Создаем копию scheduleMap для добавления буферов
        const scheduleMapWithBuffer = { ...cached.scheduleMap };

        // 🎯 БУФЕР: Добавляем последние 7 дней предыдущего года
        const prevYear = year - 1;
        const prevYearCacheKey = `${departmentId}-${prevYear}`;
        if (cachedYears[prevYearCacheKey]) {
          console.log(`📎 Добавляем буфер из ${prevYear} года (последние 7 дней)`);
          const prevScheduleMap = cachedYears[prevYearCacheKey].scheduleMap;

          for (let day = 25; day <= 31; day++) {
            const dateStr = `${prevYear}-12-${String(day).padStart(2, '0')}`;

            cached.employeeIds.forEach(empId => {
              const key = `${empId}-${dateStr}`;
              if (prevScheduleMap[key]) {
                scheduleMapWithBuffer[key] = prevScheduleMap[key];
              }
            });
          }
        }

        // 🎯 БУФЕР: Добавляем первые 7 дней следующего года
        const nextYear = year + 1;
        const nextYearCacheKey = `${departmentId}-${nextYear}`;
        if (cachedYears[nextYearCacheKey]) {
          console.log(`📎 Добавляем буфер из ${nextYear} года (первые 7 дней)`);
          const nextScheduleMap = cachedYears[nextYearCacheKey].scheduleMap;

          for (let day = 1; day <= 7; day++) {
            const dateStr = `${nextYear}-01-${String(day).padStart(2, '0')}`;

            cached.employeeIds.forEach(empId => {
              const key = `${empId}-${dateStr}`;
              if (nextScheduleMap[key]) {
                scheduleMapWithBuffer[key] = nextScheduleMap[key];
              }
            });
          }
        }
      }


      // Загружаем с сервера
      console.log(`🌐 Загрузка с сервера: ${cacheKey}`);
      set({ loading: true, loadingKey: cacheKey });

      try {
        const response = await fetch(
          `../../public/data-${departmentId}-${year}.json`
        );
        const data = await response.json();
        const { employeeById, employeeIds, scheduleMap } = get().normalizeScheduleData(data, year);

        // 🎯 ОПТИМИЗАЦИЯ: Переиспользуем существующие объекты сотрудников
        const currentEmployeeById = get().employeeById;
        const optimizedEmployeeById = {};

        employeeIds.forEach(empId => {
          const newEmployee = employeeById[empId];
          const existingEmployee = currentEmployeeById[empId];

          // Если данные сотрудника не изменились, используем старый объект
          if (existingEmployee &&
              existingEmployee.name === newEmployee.name &&
              existingEmployee.fullName === newEmployee.fullName &&
              existingEmployee.position === newEmployee.position) {
            optimizedEmployeeById[empId] = existingEmployee;  // ← Переиспользуем!
          } else {
            optimizedEmployeeById[empId] = newEmployee;
          }
        });

        // 🎯 БУФЕР: Добавляем последние 7 дней предыдущего года (для недель на стыке)
        const prevYear = year - 1;
        const prevYearCacheKey = `${departmentId}-${prevYear}`;
        if (cachedYears[prevYearCacheKey]) {
          console.log(`📎 Добавляем буфер из ${prevYear} года (последние 7 дней)`);
          const prevScheduleMap = cachedYears[prevYearCacheKey].scheduleMap;          

          // Последние 7 дней декабря предыдущего года
          for (let day = 25; day <= 31; day++) {
            const dateStr = `${prevYear}-12-${String(day).padStart(2, '0')}`;

            employeeIds.forEach(empId => {
              const key = `${empId}-${dateStr}`;
              if (prevScheduleMap[key]) {
                scheduleMap[key] = prevScheduleMap[key];
              }
            });
          }
        }

        // 🎯 БУФЕР: Добавляем первые 7 дней следующего года (для недель на стыке)
        const nextYear = year + 1;
        const nextYearCacheKey = `${departmentId}-${nextYear}`;
        if (cachedYears[nextYearCacheKey]) {
          console.log(`📎 Добавляем буфер из ${nextYear} года (первые 7 дней)`);
          const nextScheduleMap = cachedYears[nextYearCacheKey].scheduleMap;

          // Первые 7 дней января следующего года
          for (let day = 1; day <= 7; day++) {
            const dateStr = `${nextYear}-01-${String(day).padStart(2, '0')}`;

            employeeIds.forEach(empId => {
              const key = `${empId}-${dateStr}`;
              if (nextScheduleMap[key]) {
                scheduleMap[key] = nextScheduleMap[key];
              }
            });
          }
        }

        // Сохраняем в кэш
        set(state => ({
          scheduleMap: scheduleMap || {},
          employeeById: optimizedEmployeeById,
          employeeIds: employeeIds,
          loadedYear: year,
          loadedDepartment: departmentId,
          cachedYears: {
            ...state.cachedYears,
            [cacheKey]: { scheduleMap, employeeById: optimizedEmployeeById, employeeIds }
          },
          loading: false,
          loadingKey: null
        }));

        console.log(`✅ Данные загружены и закэшированы: ${cacheKey}`);
        console.log('employeeIds:', employeeIds);
        console.log('employeeById:', optimizedEmployeeById);
        console.log('scheduleMap size:', Object.keys(scheduleMap).length);

      } catch (error) {
        console.error('Failed to load schedule:', error);
        set({ loading: false, loadingKey: null });
      }
    },
    
    // Нормализация данных с сервера
    normalizeScheduleData: (rawData, year) => {
      const employeeById = {};
      const employeeIds = [];
      const scheduleMap = {};

      rawData.data.forEach(employee => {
        const employeeId = String(employee.id);

        // Добавляем в список ID
        employeeIds.push(employeeId);

        // Формируем employeeById
        employeeById[employeeId] = {
          id: employeeId,
          name: `${employee.fio.family} ${employee.fio.name1[0]}.${employee.fio.name2[0]}.`,
          fullName: `${employee.fio.family} ${employee.fio.name1} ${employee.fio.name2}`,
          position: employee.position || '' // если есть
        };

        // Формируем scheduleMap
        Object.entries(employee.schedule).forEach(([dateKey, status]) => {
          // dateKey приходит как "01-01", преобразуем в "2025-01-01"
          const fullDate = `${year}-${dateKey}`;
          const key = `${employeeId}-${fullDate}`;
          scheduleMap[key] = status;
        });
      });

      return { employeeById, employeeIds, scheduleMap };
    },
    
    // Получить данные сотрудника
    getEmployee: (employeeId) => {
      return get().employeeById[employeeId] || null;
    },

    // Получить всех сотрудников (для рендера таблицы)
    getAllEmployees: () => {
      const { employeeById, employeeIds } = get();
      return employeeIds.map(id => employeeById[id]);
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
        employeeById: {},
        employeeIds: [],
        scheduleMap: {},
        changedCells: new Set(),
        loadedYear: null,
        loadedDepartment: null,
        loadingKey: null
      });
    },

    // Полностью очистить кэш (при смене отдела или выходе)
    clearCache: () => {
      set({
        employeeById: {},
        employeeIds: [],
        scheduleMap: {},
        changedCells: new Set(),
        cachedYears: {},
        loadedYear: null,
        loadedDepartment: null,
        loadingKey: null
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