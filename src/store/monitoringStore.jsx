import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export const useMonitoringStore = create(
  devtools(
    persist(
      (set, get) => ({
        // === STATE ===
        watchlist: [],
        // [
        //   {
        //     employeeId: "emp-5",
        //     name: "Сидоров С.С.",
        //     departmentId: "dept-2",
        //     departmentName: "Маркетинг",
        //     scheduleMap: {...}
        //   }
        // ]
        
        loading: {},  // { "emp-5": false, "emp-12": true }
        
        // === ACTIONS ===
        
        addToWatchlist: async (employeeId) => {
          set(state => ({
            loading: { ...state.loading, [employeeId]: true }
          }));
          
          // const response = await api.post('/api/employees/schedule', {
          //   employeeIds: [employeeId],
          //   year: 2025
          // });
          
          const employee = response.schedules[0];
          
          set(state => ({
            watchlist: [...state.watchlist, employee],
            loading: { ...state.loading, [employeeId]: false }
          }));
        },
        
        removeFromWatchlist: (employeeId) => {
          set(state => ({
            watchlist: state.watchlist.filter(e => e.employeeId !== employeeId)
          }));
        },
        
        // WebSocket: обновление для отслеживаемого сотрудника
        updateWatchedEmployee: (employeeId, changes) => {
          set(state => ({
            watchlist: state.watchlist.map(e =>
              e.employeeId === employeeId
                ? {
                    ...e,
                    scheduleMap: { ...e.scheduleMap, ...changes }
                  }
                : e
            )
          }));
        }
      }),
      {
        name: 'monitoring-storage',
        partialize: (state) => ({
          // Сохраняем только ID'шники, расписание загружаем заново
          watchlist: state.watchlist.map(e => ({
            employeeId: e.employeeId,
            name: e.name,
            departmentId: e.departmentId,
            departmentName: e.departmentName
          }))
        })
      }
    ),
    { name: 'MonitoringStore' }
  )
);