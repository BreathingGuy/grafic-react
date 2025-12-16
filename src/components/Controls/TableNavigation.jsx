import { useDateStore } from '../../store/dateStore';
import { memo } from "react"

import styles from '../Table/Table.module.css';

const TableNavigation = memo(() => {
    const currentYear = useDateStore(state => state.currentYear);
    const shiftDates = useDateStore(state => state.shiftDates);
    const canGoNext = useDateStore(state => state.canGoNext);
    const canGoPrev = useDateStore(state => state.canGoPrev);

    return (
      <div className={styles.navigation}>
        <button onClick={() => shiftDates('prev')} className={styles.navButton} disabled={!canGoPrev()}>
          ← Назад
        </button>
        <button onClick={() => shiftDates('next')} className={styles.navButton} disabled={!canGoNext()}>
          Вперёд →
        </button>
        <span>Год: {currentYear}</span>
      </div>
    )
})

export default TableNavigation;