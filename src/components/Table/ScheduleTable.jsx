import { useState, useMemo } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { getDateRange } from '../../utils/dateHelpers';
import EmployeeRow from './EmployeeRow';
import styles from './Table.module.css';

export default function ScheduleTable({ period, search }) {
  // Напрямую из Zustand store - никаких лишних слоёв
  const loading = useScheduleStore(state => state.loading);
  const [baseDate, setBaseDate] = useState(new Date('2025-11-30'));

  // TODO: Заменить мок данными из API/store
  const employeesMap = useMemo(() => ({
    10001: { id: 10001, name: 'Иванов И.И.', name_long: 'Иванов Иван Иванович', department: 'Отдел А' },
    10002: { id: 10002, name: 'Петров П.П.', name_long: 'Петров Петр Петрович', department: 'Отдел А' },
    10003: { id: 10003, name: 'Сидоров С.С.', name_long: 'Сидоров Сергей Сергеевич', department: 'Отдел Б' },
  }), []);

  // useMemo - фильтрация и сортировка только при изменении employeesMap или search
  const employees = useMemo(() => {
    let result = Object.values(employeesMap);

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(e => e.name_long.toLowerCase().includes(s));
    }

    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [employeesMap, search]);

  // useMemo - генерация дат только при изменении period или baseDate
  const [dates, monthGroups] = useMemo(() => {
    return getDateRange(period, baseDate);
  }, [period, baseDate]);

  const shift = (direction) => {
    const newDate = new Date(baseDate);

    if (period === '3months') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
    } else if (period === '1month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (period === '7days') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }

    setBaseDate(newDate);
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.tableContainer}>
      {/* Кнопки навигации */}
      <div className={styles.navigation}>
        <button onClick={() => shift('prev')} className={styles.navButton}>
          ← Назад
        </button>
        <button onClick={() => shift('next')} className={styles.navButton}>
          Вперёд →
        </button>
      </div>

      <div className={styles.tableWrapper}>
        {/* Левая фиксированная колонка с именами */}
        <div className={styles.fixedColumn}>
          <table className={styles.employeeTable}>
            <thead>
              <tr>
                <th className={styles.emptyHeader}></th>
              </tr>
              <tr>
                <th className={styles.employeeHeader}>Сотрудник</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td
                    className={styles.employeeCell}
                    title={emp.name_long}
                  >
                    {emp.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Прокручиваемая часть с датами и расписанием */}
        <div className={styles.scrollableArea}>
          <table className={styles.scheduleTable}>
            <thead>
              {/* Первая строка - месяцы */}
              <tr>
                {monthGroups.map((group, i) => (
                  <th
                    key={i}
                    colSpan={group.colspan}
                    className={styles.monthHeader}
                  >
                    {group.month}
                  </th>
                ))}
              </tr>
              {/* Вторая строка - дни */}
              <tr>
                {dates.map(date => (
                  <th key={date} className={styles.dayHeader}>
                    {new Date(date).getDate()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <EmployeeRow
                  key={emp.id}
                  employee={emp}
                  dates={dates}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}