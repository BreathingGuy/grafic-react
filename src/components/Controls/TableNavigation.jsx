import { useDateStore } from '../../store/dateStore';
import { memo } from "react"

import styles from '../Table/Table.module.css';

const TableNavigation = memo(() => {
    const currentYear = useDateStore(state => state.currentYear);
    // Подписки для реактивности canGoPrev/canGoNext
    const _baseDate = useDateStore(state => state.baseDate);
    const _period = useDateStore(state => state.period);
    void _baseDate; void _period;  // Убираем warning о неиспользуемых переменных
    const shiftDates = useDateStore(state => state.shiftDates);
    const canGoNext = useDateStore(state => state.canGoNext);
    const canGoPrev = useDateStore(state => state.canGoPrev);

    // Вычисляем на основе актуального состояния
    const canGoPrevValue = canGoPrev();
    const canGoNextValue = canGoNext();

    return (
      <div className={styles.navigation}>
        <button onClick={() => shiftDates('prev')} className={styles.navButton} disabled={!canGoPrevValue}>
          ← Назад
        </button>
        <button onClick={() => shiftDates('next')} className={styles.navButton} disabled={!canGoNextValue}>
          Вперёд →
        </button>
        <span>Год: {currentYear}</span>
      </div>
    )
})

export default TableNavigation;