import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useFetchWebStore } from './fetchWebStore';

export const useScheduleStore = create(
  devtools((set, get) => ({
    // === STATE ===
    scheduleMap: {},               // { "emp-1-2025-01-15": "Д", ... }

    // Структура хранения сотрудников
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
        return;
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

        // Добавляем буферы из соседних годов
        get().addYearBuffers(scheduleMapWithBuffer, cached.employeeIds, departmentId, year);

        set({
          scheduleMap: scheduleMapWithBuffer,
          employeeById: cached.employeeById,
          employeeIds: cached.employeeIds,
          loadedYear: year,
          loadedDepartment: departmentId
        });
        return;
      }

      // Загружаем с сервера через fetchWebStore
      console.log(`🌐 Загрузка с сервера: ${cacheKey}`);
      set({ loading: true, loadingKey: cacheKey });

      try {
        const fetchStore = useFetchWebStore.getState();
        const { employeeById, employeeIds, scheduleMap } = await fetchStore.fetchSchedule(departmentId, year);

        // Переиспользуем существующие объекты сотрудников
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
            optimizedEmployeeById[empId] = existingEmployee;
          } else {
            optimizedEmployeeById[empId] = newEmployee;
          }
        });

        // Добавляем буферы из соседних годов
        get().addYearBuffers(scheduleMap, employeeIds, departmentId, year);

        // Сохраняем в кэш и state
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
        console.log('scheduleMap size:', Object.keys(scheduleMap).length);

      } catch (error) {
        console.error('Failed to load schedule:', error);
        set({ loading: false, loadingKey: null });
      }
    },

    // Добавить буферы из соседних годов (для недель на стыке)
    addYearBuffers: (scheduleMap, employeeIds, departmentId, year) => {
      const { cachedYears } = get();

      // Последние 7 дней предыдущего года
      const prevYear = year - 1;
      const prevYearCacheKey = `${departmentId}-${prevYear}`;
      if (cachedYears[prevYearCacheKey]) {
        console.log(`📎 Добавляем буфер из ${prevYear} года (последние 7 дней)`);
        const prevScheduleMap = cachedYears[prevYearCacheKey].scheduleMap;

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

      // Первые 7 дней следующего года
      const nextYear = year + 1;
      const nextYearCacheKey = `${departmentId}-${nextYear}`;
      if (cachedYears[nextYearCacheKey]) {
        console.log(`📎 Добавляем буфер из ${nextYear} года (первые 7 дней)`);
        const nextScheduleMap = cachedYears[nextYearCacheKey].scheduleMap;

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

    // Применить изменения из админки (после публикации)
    applyChanges: (changes) => {
      const changedKeys = Object.keys(changes);

      set(state => ({
        scheduleMap: {
          ...state.scheduleMap,
          ...changes
        },
        changedCells: new Set(changedKeys)
      }));

      // Убираем подсветку через 5 секунд
      setTimeout(() => {
        set({ changedCells: new Set() });
      }, 5000);

      return changedKeys.length;
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
    }

    // === WEBSOCKET (закомментирован) ===
    // connectWebSocket, disconnectWebSocket, subscribeToUpdates, etc.
    // См. предыдущую версию для WebSocket логики

  }), { name: 'ScheduleStore' })
);
