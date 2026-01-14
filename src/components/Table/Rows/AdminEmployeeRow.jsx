import { memo } from 'react';
import { useDateAdminStore } from '../../../store/dateAdminStore';
import AdminScheduleCell from '../Cells/AdminScheduleCell';

/**
 * AdminEmployeeRow - Строка сотрудника для админской консоли
 *
 * @param {string} tableId - 'main' | 'offset' для разделения выделения между таблицами
 * @param {Object} slotToDate - маппинг слотов к датам (для offset передаётся offsetSlotToDate)
 */
const AdminEmployeeRow = memo(({ empId, empIdx, tableId = 'main', slotToDate }) => {
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
  // Проверяем slotToDate[0] чтобы обнаружить смену года
  const prevFirstDate = prevProps.slotToDate?.[0];
  const nextFirstDate = nextProps.slotToDate?.[0];

  return prevProps.empId === nextProps.empId &&
         prevProps.empIdx === nextProps.empIdx &&
         prevProps.tableId === nextProps.tableId &&
         prevFirstDate === nextFirstDate;
});

AdminEmployeeRow.displayName = 'AdminEmployeeRow';

export default AdminEmployeeRow;
