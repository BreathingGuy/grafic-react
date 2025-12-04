import { memo } from 'react';
import ScheduleCell from './ScheduleCell';

const EmployeeRow = memo(({ employee, dates }) => {
  // PROPS:
  // - employee: {id: 10001, name: "Иванов И.И.", name_long: "Иванов Иван Иванович", department: "Отдел А"}
  // - dates: ["2025-01-15", "2025-01-16", ...]

  return (
    <tr>
      {/* Прокручиваемые ячейки с датами */}
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
  // Сравниваем по ссылке (быстро!)
  // Если employee и dates не изменились - не перерисовываем
  return (
    prevProps.employee === nextProps.employee &&
    prevProps.dates === nextProps.dates
  );
});

EmployeeRow.displayName = 'EmployeeRow';

export default EmployeeRow;