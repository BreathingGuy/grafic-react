import { memo } from 'react';
import { useDateStore } from '../../store/dateStore';
import AdminScheduleCell from '../Table/Cells/AdminScheduleCell';

/**
 * AdminEmployeeRow - Строка сотрудника для админской консоли
 */
const AdminEmployeeRow = memo(({ empId }) => {
  const visibleSlots = useDateStore(state => state.visibleSlots);

  return (
    <tr>
      {visibleSlots.map(slotIndex => (
        <AdminScheduleCell
          key={slotIndex}
          employeeId={empId}
          slotIndex={slotIndex}
        />
      ))}
    </tr>
  );
}, (prevProps, nextProps) => {
  return prevProps.empId === nextProps.empId;
});

AdminEmployeeRow.displayName = 'AdminEmployeeRow';

export default AdminEmployeeRow;
