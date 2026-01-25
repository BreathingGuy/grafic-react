import { memo } from 'react';
import { useDateAdminStore } from '../../../store/dateAdminStore';
import AdminScheduleCell from '../Cells/AdminScheduleCell';

/**
 * AdminEmployeeRow - Строка сотрудника для админской консоли
 *
 * @param {string} tableId - 'main' | 'offset' для передачи в AdminScheduleCell
 * @param {Function} useSelectionStore - хук selection store (useMainSelectionStore или useOffsetSelectionStore)
 */
const AdminEmployeeRow = memo(({ empId, empIdx, tableId = 'main', useSelectionStore }) => {
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
          useSelectionStore={useSelectionStore}
        />
      ))}
    </tr>
  );
}, (prevProps, nextProps) => {
  return prevProps.empId === nextProps.empId &&
         prevProps.empIdx === nextProps.empIdx &&
         prevProps.tableId === nextProps.tableId &&
         prevProps.useSelectionStore === nextProps.useSelectionStore;
});

AdminEmployeeRow.displayName = 'AdminEmployeeRow';

export default AdminEmployeeRow;
