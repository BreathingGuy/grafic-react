import { useDateUserStore } from '../../store/dateUserStore';
import { memo } from "react"

import styles from '../Table/Table.module.css';

const TableNavigation = memo(() => {
    const currentYear = useDateUserStore(state => state.currentYear);
    const shiftDates = useDateUserStore(state => state.shiftDates);
    const canGoNext = useDateUserStore(state => state.canGoNext);
    const canGoPrev = useDateUserStore(state => state.canGoPrev);

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