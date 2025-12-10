import { useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useScheduleStore } from '../../store/scheduleStore';
import { useDateStore } from '../../store/dateStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import EmployeeRow from './EmployeeRow';
import styles from './Table.module.css';

export default function ScheduleTable({ period }) {
  // === ДАННЫЕ ИЗ ZUSTAND STORES ===

  const loading = useScheduleStore(state => state.loading);

  // 🎯 ОПТИМИЗАЦИЯ 1: Получаем employee данные через новую структуру
  // employeeIds и employeeById отдельно для переиспользования объектов
  const employeeIds = useScheduleStore(state => state.employeeIds);
  const employeeById = useScheduleStore(state => state.employeeById);

  // Получаем данные из dateStore
  const visibleSlots = useDateStore(state => state.visibleSlots);
  const slotToDate = useDateStore(state => state.slotToDate);
  const monthGroups = useDateStore(state => state.monthGroups);
  const currentYear = useDateStore(state => state.currentYear);
  const shiftDates = useDateStore(state => state.shiftDates);
  const setPeriod = useDateStore(state => state.setPeriod);

  // Workspace store для загрузки данных при смене года
  const loadYearData = useWorkspaceStore(state => state.loadYearData);

  // 🎯 ОПТИМИЗАЦИЯ 2: Debounce для загрузки года (избегаем множественных запросов)
  const debouncedLoadYear = useDebouncedCallback(
    (year) => {
      loadYearData(year);
    },
    300  // 300ms задержка - если пользователь быстро переключает года
  );

  // === ЭФФЕКТЫ ===

  // Синхронизация периода из пропса с dateStore
  useEffect(() => {
    setPeriod(period);
  }, [period, setPeriod]);

  // Загрузка данных при смене года с debounce
  useEffect(() => {
    debouncedLoadYear(currentYear);
  }, [currentYear, debouncedLoadYear]);

  // === МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ ===

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
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
              {employeeIds.map(empId => {
                const emp = employeeById[empId];
                return (
                  <tr key={empId}>
                    <td title={emp?.fullName}>
                      {emp?.name}
                    </td>
                  </tr>
                );
              })}
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
                {visibleSlots.map(slotIndex => {
                  const date = slotToDate[slotIndex];
                  return (
                    <th key={slotIndex}>
                      {date ? new Date(date).getDate() : ''}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* 🎯 ОПТИМИЗАЦИЯ 3: Передаем конкретный объект из employeeById */}
              {/* React.memo сравнит ссылки, и если объект не изменился - не перерисует */}
              {employeeIds.map(empId => (
                <EmployeeRow
                  key={empId}
                  employee={employeeById[empId]}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}