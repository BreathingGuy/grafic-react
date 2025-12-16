import { memo } from 'react';
import EditableScheduleCell from '../Table/Cells/EditableScheduleCell';

const AdminEmployeeRow = memo(({ empId, dates, emptyFromIndex }) => {
  return (
    <tr>
      {dates.map((date, index) => (
        <EditableScheduleCell
          key={`${empId}-${index}`}
          employeeId={empId}
          date={date}
          isEmpty={emptyFromIndex !== undefined && index >= emptyFromIndex}
        />
      ))}
    </tr>
  );
}, (prevProps, nextProps) => {
  return prevProps.empId === nextProps.empId &&
         prevProps.dates === nextProps.dates &&
         prevProps.emptyFromIndex === nextProps.emptyFromIndex;
});

AdminEmployeeRow.displayName = 'AdminEmployeeRow';

export default AdminEmployeeRow;
