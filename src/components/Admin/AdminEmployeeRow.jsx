import { useScheduleStore } from '../../store/scheduleStore';
import { useAdminStore } from '../../store/adminStore';
import AdminCell from './AdminCell';

export default function AdminEmployeeRow({ empId, dates, rowIndex }) {
  return (
    <tr>
      {dates.map((dateStr, colIndex) => (
        <AdminCell
          key={`${empId}-${dateStr}`}
          empId={empId}
          date={dateStr}
          rowIndex={rowIndex}
          colIndex={colIndex}
        />
      ))}
    </tr>
  );
}
