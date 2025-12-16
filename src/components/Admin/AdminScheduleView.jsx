import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useDateStore } from '../../store/dateStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useScheduleStore } from '../../store/scheduleStore';

import FixedEmployeeColumn from '../Table/Static/FixedEmployeeColumn';
import AdminScrollableTable from './AdminScrollableTable';
import TableNavigation from '../Controls/TableNavigation';

import styles from './AdminScheduleView.module.css';
import tableStyles from '../Table/Table.module.css';

export default function AdminScheduleView() {
  const currentYear = useDateStore(state => state.currentYear);
  const setPeriod = useDateStore(state => state.setPeriod);
  const loadYearData = useWorkspaceStore(state => state.loadYearData);

  // Refs для синхронизации скролла
  const topTableRef = useRef(null);
  const bottomTableRef = useRef(null);
  const isScrolling = useRef(false);

  // Устанавливаем период на год для админского вида
  useEffect(() => {
    setPeriod('1year');
  }, [setPeriod]);

  // Загрузка данных при смене года
  useEffect(() => {
    loadYearData(currentYear);
    // Также загружаем следующий год для нижней таблицы (смещение на 3 месяца может захватить следующий год)
    loadYearData(currentYear + 1);
  }, [currentYear, loadYearData]);

  // Синхронизация горизонтального скролла
  const handleTopScroll = useCallback(() => {
    if (isScrolling.current) return;
    isScrolling.current = true;

    if (bottomTableRef.current && topTableRef.current) {
      bottomTableRef.current.scrollLeft = topTableRef.current.scrollLeft;
    }

    requestAnimationFrame(() => {
      isScrolling.current = false;
    });
  }, []);

  const handleBottomScroll = useCallback(() => {
    if (isScrolling.current) return;
    isScrolling.current = true;

    if (topTableRef.current && bottomTableRef.current) {
      topTableRef.current.scrollLeft = bottomTableRef.current.scrollLeft;
    }

    requestAnimationFrame(() => {
      isScrolling.current = false;
    });
  }, []);

  // Вычисляем даты для верхней таблицы (текущий год)
  const topDates = useDateStore(state => state.datesByYear[currentYear] || []);

  // Вычисляем даты для нижней таблицы (смещение на 3 месяца вперёд)
  const bottomDates = useMemo(() => {
    const datesByYear = useDateStore.getState().datesByYear;
    const currentYearDates = datesByYear[currentYear] || [];
    const nextYearDates = datesByYear[currentYear + 1] || [];

    // Находим индекс 1 апреля (начало смещения на 3 месяца)
    const aprilStart = currentYearDates.findIndex(d => d.startsWith(`${currentYear}-04-01`));

    if (aprilStart === -1) {
      // Если апрель не найден, возвращаем пустой массив
      return [];
    }

    // Берём с апреля до конца года текущего года
    const fromApril = currentYearDates.slice(aprilStart);

    // Берём январь-март следующего года
    const janToMarchNext = nextYearDates.filter(d => {
      const month = parseInt(d.split('-')[1]);
      return month <= 3;
    });

    return [...fromApril, ...janToMarchNext];
  }, [currentYear]);

  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <h2>Администрирование графика - {currentYear}</h2>
        <TableNavigation />
      </div>

      {/* Верхняя таблица - основной год */}
      <div className={styles.tableSection}>
        <div className={styles.tableLabel}>
          <span>Январь - Декабрь {currentYear}</span>
        </div>
        <div className={tableStyles.container}>
          <FixedEmployeeColumn />
          <AdminScrollableTable
            ref={topTableRef}
            dates={topDates}
            onScroll={handleTopScroll}
          />
        </div>
      </div>

      {/* Нижняя таблица - смещённая на 3 месяца */}
      <div className={styles.tableSection}>
        <div className={styles.tableLabel}>
          <span>Апрель {currentYear} - Март {currentYear + 1}</span>
        </div>
        <div className={tableStyles.container}>
          <FixedEmployeeColumn />
          <AdminScrollableTable
            ref={bottomTableRef}
            dates={bottomDates}
            onScroll={handleBottomScroll}
          />
        </div>
      </div>
    </div>
  );
}
