import { memo } from 'react';
import { useDateStore } from '../../store/dateStore';
import ScheduleCell from './ScheduleCell';

// 🎯 КЛЮЧЕВАЯ ОПТИМИЗАЦИЯ: Принимаем только employee, без dates!
const EmployeeRow = memo(({ employee }) => {
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
    </tr>
  );
}, (prevProps, nextProps) => {
  // Сравниваем ТОЛЬКО employee
  // visibleSlots не передается в пропсах, поэтому не влияет на ререндер
  return prevProps.employee === nextProps.employee;
});

EmployeeRow.displayName = 'EmployeeRow';

export default EmployeeRow;