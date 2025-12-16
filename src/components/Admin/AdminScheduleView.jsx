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

  // Вычисляем даты для верхней таблицы (текущий год)
  const topDates = useDateStore(state => state.datesByYear[currentYear] || []);

  // Вычисляем даты для нижней таблицы (смещение на 3 месяца вперёд)
  // + вычисляем индекс, с которого начинаются пустые ячейки (янв-март следующего года)
  const { bottomDates, emptyFromIndex } = useMemo(() => {
    const datesByYear = useDateStore.getState().datesByYear;
    const currentYearDates = datesByYear[currentYear] || [];
    const nextYearDates = datesByYear[currentYear + 1] || [];

    // Находим индекс 1 апреля
    const aprilStart = currentYearDates.findIndex(d => d.startsWith(`${currentYear}-04-01`));

    if (aprilStart === -1) {
      return { bottomDates: [], emptyFromIndex: 0 };
    }

    // Берём с апреля до конца года текущего года
    const fromApril = currentYearDates.slice(aprilStart);
    const emptyStartIndex = fromApril.length; // Индекс, с которого начинаются пустые

    // Берём январь-март следующего года (будут пустыми)
    const janToMarchNext = nextYearDates.filter(d => {
      const month = parseInt(d.split('-')[1]);
      return month <= 3;
    });

    return {
      bottomDates: [...fromApril, ...janToMarchNext],
      emptyFromIndex: emptyStartIndex
    };
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
