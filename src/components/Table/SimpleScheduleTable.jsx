import { useScheduleStore } from '../../store/scheduleStore';
import SimpleEmployeeRow from './SimpleEmployeeRow';

export default function SimpleScheduleTable() {
  const employeeMap = useScheduleStore(state => state.employeeMap);
  const loading = useScheduleStore(state => state.loading);

  if (loading) return <div>Загрузка...</div>;

  const employees = Object.values(employeeMap);

  // Простой массив дат - 90 дней
  const dates = [];
  const startDate = new Date(2025, 0, 1);
  for (let i = 0; i < 90; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }

  return (
    <div>
      <h2>Простая таблица (без оптимизаций)</h2>
      <p>Сотрудников: {employees.length}, Дней: {dates.length}, Ячеек: {employees.length * dates.length}</p>

      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Сотрудник</th>
            {dates.map(date => (
              <th key={date}>{date.slice(8)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id}>
              <td>{emp.name}</td>
              <SimpleEmployeeRow employee={emp} dates={dates} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
