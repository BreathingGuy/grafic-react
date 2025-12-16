import { memo } from 'react';
import AdminScheduleCell from './AdminScheduleCell';

const AdminEmployeeRow = memo(({ empId, dates }) => {
  return (
    <tr>
      {dates.map((date, index) => (
        <AdminScheduleCell
          key={`${empId}-${index}`}
          employeeId={empId}
          date={date}
        />
      ))}
    </tr>
  );
}, (prevProps, nextProps) => {
  // Перерендер только если изменился empId или массив дат
  return prevProps.empId === nextProps.empId &&
         prevProps.dates === nextProps.dates;
});

AdminEmployeeRow.displayName = 'AdminEmployeeRow';

export default AdminEmployeeRow;
