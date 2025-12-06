import SimpleScheduleCell from './SimpleScheduleCell';

export default function SimpleEmployeeRow({ employee, dates }) {
  return (
    <tr>
      {dates.map(date => (
        <SimpleScheduleCell
          key={date}
          employeeId={employee.id}
          date={date}
        />
      ))}
    </tr>
  );
}
