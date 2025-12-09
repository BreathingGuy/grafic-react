import styles from './MonthSkeleton.module.css';

/**
 * Skeleton для отображения загружаемых месяцев
 * Показывается как placeholder пока загружаются данные следующих 3 месяцев
 *
 * @param {number} employeeCount - Количество сотрудников (для количества строк)
 * @param {number} daysCount - Количество дней для отображения (по умолчанию 90 - 3 месяца)
 */
export default function MonthSkeleton({ employeeCount = 10, daysCount = 90 }) {
  // Создаем массив дней для отображения skeleton колонок
  const days = Array.from({ length: daysCount }, (_, i) => i);
  const employees = Array.from({ length: employeeCount }, (_, i) => i);

  return (
    <div className={styles.container}>
      {/* Заголовок - месяцы */}
      <div className={styles.header}>
        {/* Примерно 3 месяца - 3 блока */}
        <div className={styles.monthHeader}>
          <div className={styles.skeletonMonth}></div>
        </div>
        <div className={styles.monthHeader}>
          <div className={styles.skeletonMonth}></div>
        </div>
        <div className={styles.monthHeader}>
          <div className={styles.skeletonMonth}></div>
        </div>
      </div>

      {/* Дни - показываем только несколько для эффекта */}
      <div className={styles.daysRow}>
        {days.slice(0, 30).map(day => (
          <div key={day} className={styles.dayCell}>
            <div className={styles.skeletonDay}></div>
          </div>
        ))}
      </div>

      {/* Ряды сотрудников */}
      <div className={styles.rows}>
        {employees.map(emp => (
          <div key={emp} className={styles.employeeRow}>
            {days.slice(0, 30).map(day => (
              <div key={day} className={styles.cell}>
                <div className={styles.skeletonCell}></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
