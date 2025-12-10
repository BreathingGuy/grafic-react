import { memo } from 'react';
import ScheduleCell from './ScheduleCell';

// 🎯 КЛЮЧЕВАЯ ОПТИМИЗАЦИЯ: Принимаем visibleSlots как проп для контроля ререндера
const EmployeeRow = memo(({ employee, visibleSlots }) => {
  return (
    <tr>
      {visibleSlots.map(slotIndex => (
        <ScheduleCell
          key={slotIndex}         // ← Ключ фиксированный!
          employeeId={employee.id}
          slotIndex={slotIndex}   // ← Пропс фиксированный!
        />
      ))}
    </tr>
  );
}, (prevProps, nextProps) => {
  // Сравниваем employee и длину visibleSlots
  // Если длина не изменилась, то массив тот же (индексы те же)
  return (
    prevProps.employee === nextProps.employee &&
    prevProps.visibleSlots.length === nextProps.visibleSlots.length
  );
});

EmployeeRow.displayName = 'EmployeeRow';

export default EmployeeRow;