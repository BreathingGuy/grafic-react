import { memo } from 'react';
import { useDateAdminStore } from '../../../store/dateAdminStore';
import AdminScheduleCell from '../Cells/AdminScheduleCell';

/**
 * AdminEmployeeRow - Строка сотрудника для админской консоли
 *
 * @param {string} tableId - 'main' | 'offset' для передачи в AdminScheduleCell
 */
const AdminEmployeeRow = memo(({ empId, empIdx, tableId = 'main' }) => {
  const visibleSlots = useDateAdminStore(state => state.visibleSlots);

  return (
    <tr>
      {visibleSlots.map(slotIndex => (
        <AdminScheduleCell
          key={slotIndex}
          employeeId={empId}
          slotIndex={slotIndex}
          empIdx={empIdx}
          tableId={tableId}
        />
      ))}
    </tr>
  );
}, (prevProps, nextProps) => {
  return prevProps.empId === nextProps.empId &&
         prevProps.empIdx === nextProps.empIdx &&
         prevProps.tableId === nextProps.tableId;
});

AdminEmployeeRow.displayName = 'AdminEmployeeRow';

export default AdminEmployeeRow;
