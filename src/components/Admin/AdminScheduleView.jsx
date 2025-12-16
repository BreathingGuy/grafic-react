import { useEffect, useRef, useMemo } from 'react';
import { useDateStore } from '../../store/dateStore';
import { useWorkspaceStore } from '../../store/workspaceStore';

import VirtualizedAdminTable from './VirtualizedAdminTable';
import AdminNavigation from './AdminNavigation';

import styles from './AdminScheduleView.module.css';

export default function AdminScheduleView() {
  const currentYear = useDateStore(state => state.currentYear);
  const setPeriod = useDateStore(state => state.setPeriod);
  const extendToYear = useDateStore(state => state.extendToYear);
  const loadYearData = useWorkspaceStore(state => state.loadYearData);

  // Устанавливаем период на год для админского вида
  useEffect(() => {
    setPeriod('1year');
  }, [setPeriod]);

  // Загрузка данных при смене года + расширение диапазона для нижней таблицы
  useEffect(() => {
    extendToYear(currentYear + 1);
    loadYearData(currentYear);
  }, [currentYear, loadYearData, extendToYear]);

  // Кэш для массивов дат
  const datesCache = useRef({ year: null, topDates: [], bottomDates: [], emptyFromIndex: 0 });

  // Вычисляем даты только при смене года
  const { topDates, bottomDates, emptyFromIndex } = useMemo(() => {
    if (datesCache.current.year === currentYear) {
      return datesCache.current;
    }

    const datesByYear = useDateStore.getState().datesByYear;
    const currentYearDates = datesByYear[currentYear] || [];
    const nextYearDates = datesByYear[currentYear + 1] || [];

    const aprilStart = currentYearDates.findIndex(d => d.startsWith(`${currentYear}-04-01`));

    let bottomDatesResult = [];
    let emptyFromIndexResult = 0;

    if (aprilStart !== -1) {
      const fromApril = currentYearDates.slice(aprilStart);
      emptyFromIndexResult = fromApril.length;

      const janToMarchNext = nextYearDates.filter(d => {
        const month = parseInt(d.split('-')[1]);
        return month <= 3;
      });

      bottomDatesResult = [...fromApril, ...janToMarchNext];
    }

    datesCache.current = {
      year: currentYear,
      topDates: currentYearDates,
      bottomDates: bottomDatesResult,
      emptyFromIndex: emptyFromIndexResult
    };

    return datesCache.current;
  }, [currentYear]);

  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <span className={styles.yearTitle}>{currentYear}</span>
        <AdminNavigation />
      </div>

      <VirtualizedAdminTable
        topDates={topDates}
        bottomDates={bottomDates}
        emptyFromIndex={emptyFromIndex}
      />
    </div>
  );
}
