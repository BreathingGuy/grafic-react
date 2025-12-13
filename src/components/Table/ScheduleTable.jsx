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
  const slotToDay = useDateStore(state => state.slotToDay);  // ← Для оптимизации заголовков
  const monthGroups = useDateStore(state => state.monthGroups);
  const currentYear = useDateStore(state => state.currentYear);
  const shiftDates = useDateStore(state => state.shiftDates);
  const setPeriod = useDateStore(state => state.setPeriod);
  const canGoNext = useDateStore(state => state.canGoNext);
  const canGoPrev = useDateStore(state => state.canGoPrev);
  const animationDirection = useDateStore(state => state.animationDirection);
  const isAnimating = useDateStore(state => state.isAnimating);

  // Workspace store для загрузки данных при смене года
  const loadYearData = useWorkspaceStore(state => state.loadYearData);

  // 🎯 ОПТИМИЗАЦИЯ 2: Debounce для загрузки года (избегаем множественных запросов)
  const debouncedLoadYear = useDebouncedCallback(
    (year) => {
      loadYearData(year);
    },
    300  // 300ms задержка - если пользователь быстро переключает года
  );

  // 🖱️ Debounced wheel navigation (предотвращает слишком частые переключения)
  const debouncedWheelNav = useDebouncedCallback(
    (direction) => {
      shiftDates(direction);
    },
    200  // 200ms задержка между переключениями
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

  // === ОБРАБОТЧИКИ ===

  // 🖱️ Обработчик колесика мышки для навигации
  const handleWheel = (e) => {
    // Игнорируем если уже идет анимация
    if (isAnimating) return;

    // deltaY > 0 = прокрутка вниз = назад
    // deltaY < 0 = прокрутка вверх = вперед
    if (Math.abs(e.deltaY) > 10) {  // Порог чувствительности
      if (e.deltaY > 0 && canGoPrev()) {
        debouncedWheelNav('prev');
      } else if (e.deltaY < 0 && canGoNext()) {
        debouncedWheelNav('next');
      }
    }
  };

  // === МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ ===

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  // Определяем CSS класс для анимации
  const getAnimationClass = () => {
    if (!animationDirection) return '';
    return animationDirection === 'next' ? styles.slideNext : styles.slidePrev;
  };

  return (
    <div className={styles.tableContainer}>
      {/* Кнопки навигации по датам */}
      <div className={styles.navigation}>
        <button
          onClick={() => shiftDates('prev')}
          className={styles.navButton}
          disabled={!canGoPrev()}
        >
          ← Назад
        </button>
        <button
          onClick={() => shiftDates('next')}
          className={styles.navButton}
          disabled={!canGoNext()}
        >
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

        <div className={styles.scrollable_container} onWheel={handleWheel}>
          <table className={`${styles.scrollable_column} ${getAnimationClass()}`}>
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
                  if (!date) return null;  // Пропускаем пустые слоты

                  const day = slotToDay[slotIndex];  // Быстрый доступ к числу дня
                  return (
                    <th key={slotIndex}>
                      {day}
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