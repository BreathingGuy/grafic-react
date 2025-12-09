import { useMemo, useEffect } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useDateStore } from '../../store/dateStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import EmployeeRow from './EmployeeRow';
import styles from './Table.module.css';

export default function ScheduleTable({ period }) {
  // === ДАННЫЕ ИЗ ZUSTAND STORES ===

  const loading = useScheduleStore(state => state.loading);
  const employees = useScheduleStore(state => state.employeeMap);

  // Получаем данные из dateStore
  const visibleSlots = useDateStore(state => state.visibleSlots);
  const slotToDate = useDateStore(state => state.slotToDate);
  const monthGroups = useDateStore(state => state.monthGroups);
  const currentYear = useDateStore(state => state.currentYear);
  const shiftDates = useDateStore(state => state.shiftDates);
  const setPeriod = useDateStore(state => state.setPeriod);

  // Workspace store для загрузки данных
  const loadVisibleYearsData = useWorkspaceStore(state => state.loadVisibleYearsData);

  // === ЭФФЕКТЫ ===

  // Синхронизация периода из пропса с dateStore
  useEffect(() => {
    setPeriod(period);
  }, [period, setPeriod]);

  // Загрузка данных для всех видимых годов при изменении слотов
  useEffect(() => {
    loadVisibleYearsData();
  }, [visibleSlots.length, loadVisibleYearsData]);

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
              {/* Каждая строка = сотрудник */}
              {/* 🎯 Передаем ТОЛЬКО employee - без dates! */}
              {employees.map(emp => (
                <EmployeeRow
                  key={emp.id}
                  employee={emp}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}