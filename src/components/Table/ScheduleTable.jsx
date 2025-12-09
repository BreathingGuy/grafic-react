import { useEffect } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useDateStore } from '../../store/dateStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import EmployeeRow from './EmployeeRow';
import LoadingIndicator from '../Loader/LoadingIndicator';
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
  const setPeriod = useDateStore(state => state.setPeriod);

  // Workspace store для загрузки данных при смене года
  const loadYearData = useWorkspaceStore(state => state.loadYearData);

  // 🎯 ВИРТУАЛИЗАЦИЯ - infinite scroll
  const {
    scrollContainerRef,
    isLoadingMore,
    canLoadMore,
    loadingProgress
  } = useInfiniteScroll({
    threshold: 300,      // Показываем индикатор за 300px до конца
    triggerThreshold: 100 // Триггерим загрузку за 100px до конца
  });

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

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.tableContainer}>
      {/* Индикатор текущего года */}
      <div className={styles.yearIndicator}>
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

        {/* 🎯 ВИРТУАЛИЗАЦИЯ - добавляем ref на scrollable_container */}
        <div className={styles.scrollable_container} ref={scrollContainerRef}>
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
                {/* Заголовок для загружаемых месяцев */}
                {isLoadingMore && (
                  <th colSpan={90} className={styles.loadingHeader}>
                    Загрузка следующих 3 месяцев...
                  </th>
                )}
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
                {/* Дни для загружаемых месяцев */}
                {isLoadingMore && (
                  Array.from({ length: 90 }, (_, i) => (
                    <th key={`loading-day-${i}`} className={styles.skeletonHeader}>
                      <div className={styles.skeletonBox}></div>
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {/* Каждая строка = сотрудник */}
              {employees.map(emp => (
                <EmployeeRow
                  key={emp.id}
                  employee={emp}
                  isLoadingMore={isLoadingMore}
                />
              ))}
            </tbody>
          </table>

          {/* 🎯 ИНДИКАТОР ЗАГРУЗКИ - sticky справа */}
          {canLoadMore && (loadingProgress > 0 || isLoadingMore) && (
            <div className={styles.loadingIndicatorOverlay}>
              <LoadingIndicator
                progress={loadingProgress}
                isLoading={isLoadingMore}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}