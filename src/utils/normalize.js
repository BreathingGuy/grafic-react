// JSON от сервера → нормализованный scheduleMap
export const normalizeSchedule = (employees) => {
  const scheduleMap = {};
  const employeesMap = {};
  
  employees.forEach(emp => {
    // Мета сотрудника
    employeesMap[emp.id] = {
      id: emp.id,
      name: `${emp.fio.family} ${emp.fio.name1[0]}.${emp.fio.name2[0]}.`,
      name_long: `${emp.fio.family} ${emp.fio.name1} ${emp.fio.name2}`,
      department: emp.department
    };
    
    // Расписание
    Object.entries(emp.schedule).forEach(([date, status]) => {
      const fullDate = `2025-${date}`;
      const key = createScheduleKey(emp.id, fullDate);
      scheduleMap[key] = status;
    });
  });
  
  return { scheduleMap, employeesMap };
};

// scheduleMap → JSON для отправки на сервер
export const denormalizeSchedule = (scheduleMap, employeeIds) => {
  const employees = {};
  
  Object.entries(scheduleMap).forEach(([key, status]) => {
    const [employeeId, date] = key.split('-');
    const shortDate = date.slice(5); // "2025-01-15" → "01-15"
    
    if (!employees[employeeId]) {
      employees[employeeId] = { schedule: {} };
    }
    
    employees[employeeId].schedule[shortDate] = status;
  });
  
  return Object.entries(employees).map(([id, data]) => ({
    id: parseInt(id),
    schedule: data.schedule
  }));
};

// Определить какие ячейки изменились
export const detectChanges = (draftMap, productionMap) => {
  const changed = new Set();
  
  Object.keys(draftMap).forEach(key => {
    if (draftMap[key] !== productionMap[key]) {
      changed.add(key);
    }
  });
  
  return changed;
};

export const createScheduleKey = (employeeId, date) => {
  return `${employeeId}-${date}`;
};