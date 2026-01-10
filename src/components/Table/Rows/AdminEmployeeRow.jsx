import { memo } from 'react';
import { useDateStore } from '../../../store/dateStore';
import AdminScheduleCell from '../Cells/AdminScheduleCell';

/**
 * AdminEmployeeRow - Строка сотрудника для админской консоли
 */
const AdminEmployeeRow = memo(({ empId, empIdx }) => {
  const visibleSlots = useDateStore(state => state.visibleSlots);

  return (
    <tr>
      {visibleSlots.map(slotIndex => (
        <AdminScheduleCell
          key={slotIndex}
          employeeId={empId}
          slotIndex={slotIndex}
          empIdx={empIdx}
        />
      ))}
    </tr>
  );
}, (prevProps, nextProps) => {
  return prevProps.empId === nextProps.empId && prevProps.empIdx === nextProps.empIdx;
});

AdminEmployeeRow.displayName = 'AdminEmployeeRow';

export default AdminEmployeeRow;
