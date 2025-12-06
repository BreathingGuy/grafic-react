import { useMemo, useEffect } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useDateStore } from '../../store/dateStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import EmployeeRow from './EmployeeRow';
import styles from './Table.module.css';

export default function ScheduleTable({ period, search }) {
  // === ДАННЫЕ ИЗ ZUSTAND STORES ===

  // Подписка на loading state
  const loading = useScheduleStore(state => state.loading);

  // Подписка на employeeMap - объект { "1000": {id, name, fullName}, ... }
  const employeeMap = useScheduleStore(state => state.employeeMap);

  // Получаем даты и навигацию из dateStore
  const visibleDates = useDateStore(state => state.visibleDates);
  const monthGroups = useDateStore(state => state.monthGroups);
  const currentYear = useDateStore(state => state.currentYear);
  const shiftDates = useDateStore(state => state.shiftDates);
  const setPeriod = useDateStore(state => state.setPeriod);

  // Workspace store для загрузки данных при смене года
  const loadYearData = useWorkspaceStore(state => state.loadYearData);

  // === ЭФФЕКТЫ ===

  // Синхронизация периода из пропса с dateStore
  useEffect(() => {
    setPeriod(period);
  }, [period, setPeriod]);

  // Загрузка данных при смене года
  useEffect(() => {
    loadYearData(currentYear);
  }, [currentYear, loadYearData]);

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
        <button onClick={() => shiftDates('prev')} className={styles.navButton}>
          ← Назад
        </button>
        <button onClick={() => shiftDates('next')} className={styles.navButton}>
          Вперёд →
        </button>
        <span className={styles.yearLabel}>Год: {currentYear}</span>
      </div>

      <div className={styles.container}>
        {/* ЛЕВАЯ ФИКСИРОВАННАЯ КОЛОНКА - имена сотрудников */}
        <table className={styles.fixed_column}>
            <thead>
              <tr>
                <th></th>
              </tr>
              <tr>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td
                    title={emp.fullName}
                  >
                    {emp.name}
                  </td>
                </tr>
              ))}
            </tbody>
        </table>

        <div className={styles.scrollable_container}>
          <table className={styles.scrollable_column}>
            <thead>
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
              <tr>
                {visibleDates.map(date => (
                  <th key={date}>
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
                  dates={visibleDates}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
