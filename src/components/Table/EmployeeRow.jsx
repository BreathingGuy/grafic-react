import { memo } from 'react';
import { useDateStore } from '../../store/dateStore';
import ScheduleCell from './ScheduleCell';
import styles from './Table.module.css';

// 🎯 КЛЮЧЕВАЯ ОПТИМИЗАЦИЯ: Принимаем только employee, без dates!
const EmployeeRow = memo(({ employee, isLoadingMore = false }) => {
  // Получаем фиксированный массив слотов из dateStore
  // visibleSlots НИКОГДА НЕ МЕНЯЕТСЯ - всегда [0, 1, 2, ..., 89]
  const visibleSlots = useDateStore(state => state.visibleSlots);

  return (
    <tr>
      {visibleSlots.map(slotIndex => (
        <ScheduleCell
          key={slotIndex}         // ← Ключ фиксированный!
          employeeId={employee.id}
          slotIndex={slotIndex}   // ← Пропс фиксированный!
        />
      ))}
      {/* Skeleton ячейки при загрузке следующих месяцев */}
      {isLoadingMore && (
        Array.from({ length: 90 }, (_, i) => (
          <td key={`loading-${i}`} className={styles.skeletonCell}>
            <div className={styles.skeletonBox}></div>
          </td>
        ))
      )}
    </tr>
  );
}, (prevProps, nextProps) => {
  // Сравниваем employee и isLoadingMore
  return prevProps.employee === nextProps.employee &&
         prevProps.isLoadingMore === nextProps.isLoadingMore;
});

EmployeeRow.displayName = 'EmployeeRow';

export default EmployeeRow;