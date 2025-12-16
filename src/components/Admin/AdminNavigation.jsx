import { memo } from 'react';
import { useDateStore } from '../../store/dateStore';

import styles from './AdminScheduleView.module.css';

const AdminNavigation = memo(() => {
  const currentYear = useDateStore(state => state.currentYear);
  const goToYear = useDateStore(state => state.goToYear);
  const minYear = useDateStore(state => state.minYear);

  const handlePrev = () => {
    if (currentYear > minYear) {
      goToYear(currentYear - 1);
    }
  };

  const handleNext = () => {
    // Без ограничения вперёд - автоматически расширяет диапазон
    goToYear(currentYear + 1);
  };

  return (
    <div className={styles.navigation}>
      <button
        onClick={handlePrev}
        className={styles.navButton}
        disabled={currentYear <= minYear}
      >
        ← Назад
      </button>
      <button
        onClick={handleNext}
        className={styles.navButton}
      >
        Вперёд →
      </button>
    </div>
  );
});

AdminNavigation.displayName = 'AdminNavigation';

export default AdminNavigation;
