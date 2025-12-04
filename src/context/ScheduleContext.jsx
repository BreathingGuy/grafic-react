import { createContext, useContext } from 'react';
import { useScheduleStore } from '../store/scheduleStore';
import { useAdminStore } from '../store/adminStore';

const ScheduleContext = createContext(null);

export function ScheduleProvider({ children }) {
  // Мок данные для разработки
  const employeesMap = {
    10001: { id: 10001, name: 'Иванов И.И.', name_long: 'Иванов Иван Иванович', department: 'Отдел А' },
    10002: { id: 10002, name: 'Петров П.П.', name_long: 'Петров Петр Петрович', department: 'Отдел А' },
    10003: { id: 10003, name: 'Сидоров С.С.', name_long: 'Сидоров Сергей Сергеевич', department: 'Отдел Б' },
  };

  const value = {
    employeesMap,
    loading: false,
    getStatus: (employeeId, date) => {
      const key = `${employeeId}-${date}`;
      const scheduleMap = useScheduleStore.getState().scheduleMap;
      const draftSchedule = useScheduleStore.getState().draftSchedule;
      const editMode = useAdminStore.getState().editMode;

      // В режиме редактирования показываем черновик, иначе production
      if (editMode && draftSchedule[key] !== undefined) {
        return draftSchedule[key];
      }
      return scheduleMap[key] || '';
    }
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within ScheduleProvider');
  }
  return context;
}
