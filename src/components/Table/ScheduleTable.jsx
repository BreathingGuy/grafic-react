import { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useDateStore } from '../../store/dateStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import ScheduleCell from './ScheduleCell';
import styles from './Table.module.css';

export default function ScheduleTable({ period, search }) {
  // === ЛОКАЛЬНОЕ СОСТОЯНИЕ ===

  const [loadingLeft, setLoadingLeft] = useState(false);
  const [loadingRight, setLoadingRight] = useState(false);

  // === ДАННЫЕ ИЗ ZUSTAND STORES ===

  // Подписка на loading state
  const loading = useScheduleStore(state => state.loading);

  // Подписка на employeeMap - объект { "1000": {id, name, fullName}, ... }
  const employeeMap = useScheduleStore(state => state.employeeMap);

  // Получаем данные из dateStore
  const visibleSlots = useDateStore(state => state.visibleSlots);
  const slotToDate = useDateStore(state => state.slotToDate);
  const monthGroups = useDateStore(state => state.monthGroups);
  const currentYear = useDateStore(state => state.currentYear);
  const viewportOffset = useDateStore(state => state.viewportOffset);
  const shiftDates = useDateStore(state => state.shiftDates);
  const expandLeft = useDateStore(state => state.expandLeft);
  const expandRight = useDateStore(state => state.expandRight);
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

  // === INFINITE SCROLL - INTERSECTION OBSERVER ===

  const leftSentinelRef = useRef(null);
  const rightSentinelRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Обработчик для левого sentinel - когда пользователь доходит до начала
  const handleLeftIntersect = useCallback(async () => {
    if (loadingLeft) return; // Уже загружаем

    console.log('⬅️ Left sentinel visible, expanding left...');
    setLoadingLeft(true);

    // Симулируем задержку загрузки (в реальности данные уже в памяти)
    await new Promise(resolve => setTimeout(resolve, 300));

    // Сохраняем текущую позицию скролла
    const container = scrollContainerRef.current;
    const scrollBefore = container?.scrollLeft || 0;
    const scrollWidthBefore = container?.scrollWidth || 0;

    // Расширяем влево
    const expanded = expandLeft(20);

    if (expanded && container) {
      // После добавления элементов слева, корректируем scroll position
      // чтобы пользователь остался на той же позиции визуально
      setTimeout(() => {
        const scrollWidthAfter = container.scrollWidth;
        const scrollDiff = scrollWidthAfter - scrollWidthBefore;
        container.scrollLeft = scrollBefore + scrollDiff;
        console.log('📍 Scroll adjusted:', { scrollBefore, scrollDiff, newScroll: container.scrollLeft });
      }, 0);
    }

    setLoadingLeft(false);
  }, [loadingLeft, expandLeft]);

  // Обработчик для правого sentinel - когда пользователь доходит до конца
  const handleRightIntersect = useCallback(async () => {
    if (loadingRight) return; // Уже загружаем

    console.log('➡️ Right sentinel visible, expanding right...');
    setLoadingRight(true);

    // Симулируем задержку загрузки
    await new Promise(resolve => setTimeout(resolve, 300));

    // Расширяем вправо (scroll position не нужно корректировать)
    expandRight(20);

    setLoadingRight(false);
  }, [loadingRight, expandRight]);

  // Настройка IntersectionObserver для левого sentinel
  useEffect(() => {
    const leftSentinel = leftSentinelRef.current;
    const container = scrollContainerRef.current;

    if (!leftSentinel || !container) {
      console.warn('⚠️ Left sentinel or container not found');
      return;
    }

    console.log('🎯 Setting up left IntersectionObserver', { leftSentinel, container });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          console.log('👁️ Left sentinel intersection:', {
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
            boundingClientRect: entry.boundingClientRect
          });

          if (entry.isIntersecting && entry.intersectionRatio > 0) {
            handleLeftIntersect();
          }
        });
      },
      {
        root: container,
        threshold: [0, 0.1, 0.5, 1],
        rootMargin: '0px 100px 0px 0px' // Уменьшил с 200px до 100px
      }
    );

    observer.observe(leftSentinel);
    console.log('✅ Left observer attached');

    return () => {
      console.log('🗑️ Disconnecting left observer');
      observer.disconnect();
    };
  }, [handleLeftIntersect]);

  // Настройка IntersectionObserver для правого sentinel
  useEffect(() => {
    const rightSentinel = rightSentinelRef.current;
    const container = scrollContainerRef.current;

    if (!rightSentinel || !container) {
      console.warn('⚠️ Right sentinel or container not found');
      return;
    }

    console.log('🎯 Setting up right IntersectionObserver', { rightSentinel, container });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          console.log('👁️ Right sentinel intersection:', {
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
            boundingClientRect: entry.boundingClientRect
          });

          if (entry.isIntersecting && entry.intersectionRatio > 0) {
            handleRightIntersect();
          }
        });
      },
      {
        root: container,
        threshold: [0, 0.1, 0.5, 1],
        rootMargin: '0px 0px 0px 100px' // Уменьшил с 200px до 100px
      }
    );

    observer.observe(rightSentinel);
    console.log('✅ Right observer attached');

    return () => {
      console.log('🗑️ Disconnecting right observer');
      observer.disconnect();
    };
  }, [handleRightIntersect]);

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
      {/* Кнопки навигации по периодам */}
      <div className={styles.navigation}>
        <button onClick={() => shiftDates('prev')} className={styles.navButton}>
          ← Предыдущий период
        </button>
        <button onClick={() => shiftDates('next')} className={styles.navButton}>
          Следующий период →
        </button>
        <span className={styles.yearLabel}>
          Год: {currentYear} | Видимых дней: {visibleSlots.length}
        </span>
        <span className={styles.hint}>
          💡 Скроллируйте горизонтально для просмотра дат
        </span>
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

        <div className={styles.scrollable_container} ref={scrollContainerRef}>
          <table className={styles.scrollable_column}>
            <thead>
              <tr>
                {/* Левый sentinel header (видимый) */}
                <th
                  ref={leftSentinelRef}
                  className={styles.sentinelColumn}
                  style={{ width: '10px', minWidth: '10px', padding: 0 }}
                />

                {/* Левый loading header */}
                {loadingLeft && (
                  <th colSpan={7} className={styles.sentinelCell}>
                    ⬅️ Загрузка...
                  </th>
                )}

                {/* Заголовки месяцев */}
                {monthGroups.map((group, i) => (
                  <th
                    key={i}
                    colSpan={group.colspan}
                    className={styles.monthHeader}
                  >
                    {group.month}
                  </th>
                ))}

                {/* Правый loading header */}
                {loadingRight && (
                  <th colSpan={7} className={styles.sentinelCell}>
                    Загрузка... ➡️
                  </th>
                )}

                {/* Правый sentinel header (видимый) */}
                <th
                  ref={rightSentinelRef}
                  className={styles.sentinelColumn}
                  style={{ width: '10px', minWidth: '10px', padding: 0 }}
                />
              </tr>
              <tr>
                {/* Левый sentinel дата */}
                <th className={styles.sentinelColumn} style={{ width: '10px', minWidth: '10px', padding: 0 }} />

                {/* Левые skeleton даты */}
                {loadingLeft && Array.from({ length: 7 }).map((_, i) => (
                  <th key={`skeleton-left-${i}`} className={styles.skeletonHeader}>
                    <div className={styles.skeletonPulse} />
                  </th>
                ))}

                {/* Основные даты */}
                {visibleSlots.map(slotIndex => {
                  const realIndex = slotIndex + viewportOffset;
                  const date = slotToDate[realIndex];
                  return (
                    <th key={slotIndex}>
                      {date ? new Date(date).getDate() : ''}
                    </th>
                  );
                })}

                {/* Правые skeleton даты */}
                {loadingRight && Array.from({ length: 7 }).map((_, i) => (
                  <th key={`skeleton-right-${i}`} className={styles.skeletonHeader}>
                    <div className={styles.skeletonPulse} />
                  </th>
                ))}

                {/* Правый sentinel дата */}
                <th className={styles.sentinelColumn} style={{ width: '10px', minWidth: '10px', padding: 0 }} />
              </tr>
            </thead>
            <tbody>
              {/* Основные строки сотрудников */}
              {employees.map(emp => (
                <tr key={emp.id}>
                  {/* Левый sentinel для этой строки */}
                  <td className={styles.sentinelColumn} style={{ width: '10px', minWidth: '10px', padding: 0 }} />

                  {/* Левые skeleton ячейки */}
                  {loadingLeft && Array.from({ length: 7 }).map((_, i) => (
                    <td key={`skeleton-left-${emp.id}-${i}`} className={styles.skeletonCell}>
                      <div className={styles.skeletonPulse} />
                    </td>
                  ))}

                  {/* Основные ячейки сотрудника */}
                  {visibleSlots.map(slotIndex => (
                    <ScheduleCell
                      key={slotIndex}
                      employeeId={emp.id}
                      slotIndex={slotIndex}
                    />
                  ))}

                  {/* Правые skeleton ячейки */}
                  {loadingRight && Array.from({ length: 7 }).map((_, i) => (
                    <td key={`skeleton-right-${emp.id}-${i}`} className={styles.skeletonCell}>
                      <div className={styles.skeletonPulse} />
                    </td>
                  ))}

                  {/* Правый sentinel для этой строки */}
                  <td className={styles.sentinelColumn} style={{ width: '10px', minWidth: '10px', padding: 0 }} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
