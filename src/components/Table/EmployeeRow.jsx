import { memo, useEffect } from 'react';
import ScheduleCell from './ScheduleCell';

const EmployeeRow = memo(({ employee, dates }) => {
  return (
    <tr>
      {dates.map(date => (
        <ScheduleCell
          key={date}
          employeeId={employee.id}
          date={date}
        />
      ))}
    </tr>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.employee === nextProps.employee &&
    prevProps.dates === nextProps.dates
  );
});

EmployeeRow.displayName = 'EmployeeRow';

export default EmployeeRow;