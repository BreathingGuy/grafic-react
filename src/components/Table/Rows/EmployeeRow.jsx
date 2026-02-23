import { memo } from 'react';
import { useDateUserStore } from '../../../store/dateUserStore';
import ViewScheduleCell from '../Cells/ViewScheduleCell';

const EmployeeRow = memo(({ empId }) => {
  const visibleSlots = useDateUserStore(state => state.visibleSlots);

  return (
    <tr>
      {visibleSlots.map(slotIndex => (
        <ViewScheduleCell
          key={slotIndex}         // ← Ключ фиксированный!
          employeeId={empId}
          slotIndex={slotIndex}   // ← Пропс фиксированный!
        />
      ))}
    </tr>
  );
}, (prevProps, nextProps) => {
  return prevProps.empId === nextProps.empId;
});

EmployeeRow.displayName = 'EmployeeRow';

export default EmployeeRow;