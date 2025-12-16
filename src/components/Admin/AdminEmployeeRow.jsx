import { memo } from 'react';
import EditableScheduleCell from '../Table/Cells/EditableScheduleCell';

const AdminEmployeeRow = memo(({ empId, dates, emptyFromIndex }) => {
  return (
    <tr>
      {dates.map((date, index) => (
        <EditableScheduleCell
          key={`${empId}-${date}`}
          employeeId={empId}
          date={date}
          isEmpty={emptyFromIndex !== undefined && index >= emptyFromIndex}
        />
      ))}
    </tr>
  );
}, (prevProps, nextProps) => {
  // Сравниваем по содержимому, не по ссылке
  const prevDates = prevProps.dates;
  const nextDates = nextProps.dates;

  if (prevProps.empId !== nextProps.empId) return false;
  if (prevProps.emptyFromIndex !== nextProps.emptyFromIndex) return false;
  if (prevDates.length !== nextDates.length) return false;
  if (prevDates.length === 0) return true;

  // Сравниваем по первой и последней дате
  return prevDates[0] === nextDates[0] &&
         prevDates[prevDates.length - 1] === nextDates[nextDates.length - 1];
});

AdminEmployeeRow.displayName = 'AdminEmployeeRow';

export default AdminEmployeeRow;
