import { useState, useMemo } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { getDateRange } from '../../utils/dateHelpers';
import EmployeeRow from './EmployeeRow';
import styles from './Table.module.css';

export default function ScheduleTable({ period, search }) {
  // === ДАННЫЕ ИЗ ZUSTAND STORE ===

  // Подписка на loading state
  const loading = useScheduleStore(state => state.loading);

  // Подписка на employeeMap - объект { "1000": {id, name, fullName}, ... }
  const employeeMap = useScheduleStore(state => state.employeeMap);

  // Локальное состояние для навигации по датам
  const [baseDate, setBaseDate] = useState(new Date());

  // === МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ ===

  // useMemo: фильтрация и сортировка сотрудников
  // Перерасчёт только при изменении employeeMap или search
  const employees = useMemo(() => {
    // Получаем массив сотрудников из employeeMap
    let result = Object.values(employeeMap);

    // Фильтрация по поиску
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(emp =>
        emp.fullName?.toLowerCase().includes(s) ||
        emp.name?.toLowerCase().includes(s)
      );
    }

    // Сортировка по фамилии
    result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [employeeMap, search]);

  // useMemo: генерация массива дат для выбранного периода
  // Перерасчёт только при изменении period или baseDate
  const [dates, monthGroups] = useMemo(() => {
    return getDateRange(period, baseDate);
  }, [period, baseDate]);

  // === НАВИГАЦИЯ ПО ДАТАМ ===

  const shift = (direction) => {
    const newDate = new Date(baseDate);

    if (period === '3months') {
      // Переход на 3 месяца вперёд/назад
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
    } else if (period === '1month') {
      // Переход на 1 месяц вперёд/назад
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (period === '7days') {
      // Переход на 7 дней вперёд/назад
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }

    setBaseDate(newDate);
  };

  // === РЕНДЕР ===

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  // Если нет сотрудников - показываем заглушку
  if (employees.length === 0) {
    return (
      <div className={styles.loading}>
        {search ? 'Сотрудники не найдены' : 'Нет данных. Выберите отдел.'}
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      {/* Кнопки навигации по датам */}
      <div className={styles.navigation}>
        <button onClick={() => shift('prev')} className={styles.navButton}>
          ← Назад
        </button>
        <button onClick={() => shift('next')} className={styles.navButton}>
          Вперёд →
        </button>
      </div>

      <div className={styles.tableWrapper}>
        {/* ЛЕВАЯ ФИКСИРОВАННАЯ КОЛОНКА - имена сотрудников */}
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
                    title={emp.fullName}
                  >
                    {emp.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ПРАВАЯ ПРОКРУЧИВАЕМАЯ ЧАСТЬ - расписание */}
        <div className={styles.scrollableArea}>
          <table className={styles.scheduleTable}>
            <thead>
              {/* Первая строка - месяцы с colspan */}
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
              {/* Вторая строка - дни месяца */}
              <tr>
                {dates.map(date => (
                  <th key={date} className={styles.dayHeader}>
                    {new Date(date).getDate()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Каждая строка = сотрудник */}
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