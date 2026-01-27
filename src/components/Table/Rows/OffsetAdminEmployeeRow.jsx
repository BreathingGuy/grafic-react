import { memo } from 'react';
import { useDateAdminStore } from '../../../store/dateAdminStore';
import OffsetAdminScheduleCell from '../Cells/OffsetAdminScheduleCell';

/**
 * OffsetAdminEmployeeRow - Строка сотрудника для offset таблицы (апрель-март)
 * Без props drilling - использует OffsetAdminScheduleCell напрямую
 */
const OffsetAdminEmployeeRow = memo(({ empId, empIdx }) => {
  const visibleSlots = useDateAdminStore(state => state.visibleSlots);

  return (
    <tr>
      {visibleSlots.map(slotIndex => (
        <OffsetAdminScheduleCell
          key={slotIndex}
          employeeId={empId}
          slotIndex={slotIndex}
          empIdx={empIdx}
        />
      ))}
    </tr>
  );
}, (prevProps, nextProps) => {
  return prevProps.empId === nextProps.empId &&
         prevProps.empIdx === nextProps.empIdx;
});

OffsetAdminEmployeeRow.displayName = 'OffsetAdminEmployeeRow';

export default OffsetAdminEmployeeRow;
