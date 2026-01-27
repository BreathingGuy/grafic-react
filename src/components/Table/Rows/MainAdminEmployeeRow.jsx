import { memo } from 'react';
import { useDateAdminStore } from '../../../store/dateAdminStore';
import MainAdminScheduleCell from '../Cells/MainAdminScheduleCell';

/**
 * MainAdminEmployeeRow - Строка сотрудника для main таблицы (январь-декабрь)
 * Без props drilling - использует MainAdminScheduleCell напрямую
 */
const MainAdminEmployeeRow = memo(({ empId, empIdx }) => {
  const visibleSlots = useDateAdminStore(state => state.visibleSlots);

  return (
    <tr>
      {visibleSlots.map(slotIndex => (
        <MainAdminScheduleCell
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

MainAdminEmployeeRow.displayName = 'MainAdminEmployeeRow';

export default MainAdminEmployeeRow;
