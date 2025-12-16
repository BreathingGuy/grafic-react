import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useDateStore } from '../../store/dateStore';
import { useWorkspaceStore } from '../../store/workspaceStore';

import FixedEmployeeColumn from '../Table/Static/FixedEmployeeColumn';
import AdminScrollableTable from './AdminScrollableTable';
import AdminNavigation from './AdminNavigation';

import styles from './AdminScheduleView.module.css';
import tableStyles from '../Table/Table.module.css';

export default function AdminScheduleView() {
  const currentYear = useDateStore(state => state.currentYear);
  const setPeriod = useDateStore(state => state.setPeriod);
  const extendToYear = useDateStore(state => state.extendToYear);
  const loadYearData = useWorkspaceStore(state => state.loadYearData);

  // Refs для синхронизации скролла
  const topTableRef = useRef(null);
  const bottomTableRef = useRef(null);
  const isScrolling = useRef(false);

  // Устанавливаем период на год для админского вида
  useEffect(() => {
    setPeriod('1year');
  }, [setPeriod]);

  // Загрузка данных при смене года + расширение диапазона для нижней таблицы
  useEffect(() => {
    // Расширяем диапазон дат для следующего года (нужно для нижней таблицы)
    extendToYear(currentYear + 1);
    loadYearData(currentYear);
  }, [currentYear, loadYearData, extendToYear]);

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

  // Кэш для массивов дат (предотвращает пересоздание при ререндерах)
  const datesCache = useRef({ year: null, topDates: [], bottomDates: [], emptyFromIndex: 0 });

  // Вычисляем даты только при смене года
  const { topDates, bottomDates, emptyFromIndex } = useMemo(() => {
    // Если год не изменился, возвращаем кэш
    if (datesCache.current.year === currentYear) {
      return datesCache.current;
    }

    const datesByYear = useDateStore.getState().datesByYear;
    const currentYearDates = datesByYear[currentYear] || [];
    const nextYearDates = datesByYear[currentYear + 1] || [];

    // Находим индекс 1 апреля
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

    // Сохраняем в кэш
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

      {/* Верхняя таблица - основной год */}
      <div className={styles.tableSection}>
        <div className={tableStyles.container}>
          <FixedEmployeeColumn />
          <AdminScrollableTable
            ref={topTableRef}
            dates={topDates}
            onScroll={handleTopScroll}
          />
        </div>
      </div>

      {/* Нижняя таблица - смещённая на 3 месяца (янв-март следующего года пустые) */}
      <div className={styles.tableSection}>
        <div className={tableStyles.container}>
          <FixedEmployeeColumn />
          <AdminScrollableTable
            ref={bottomTableRef}
            dates={bottomDates}
            onScroll={handleBottomScroll}
            emptyFromIndex={emptyFromIndex}
          />
        </div>
      </div>
    </div>
  );
}
