import { create } from 'zustand';
import { devtools } from 'zustand/middleware';


export const useFetchWebStore = create(
  devtools((set, get) => ({
    
    async fetchSchedule(departmentId, year) {
      const response = await fetch(
          `../../public/data-${departmentId}-${year}.json`
      );
      const data = await response.json();
      const { employeeById, employeeIds, scheduleMap } = get().normalizeScheduleData(data, year);
      return { employeeById, employeeIds, scheduleMap };
    },

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

  }), { name: 'FetchWebStore' })
);

export default useFetchWebStore