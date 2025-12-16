import { memo } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';

const AdminScheduleCell = memo(({ employeeId, date }) => {
  const status = useScheduleStore(state => {
    if (!date) return '';
    const key = `${employeeId}-${date}`;
    return state.scheduleMap[key] || '';
  });

  if (!date) return null;

  return (
    <td>
      {status}
    </td>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.employeeId === nextProps.employeeId &&
    prevProps.date === nextProps.date
  );
});

AdminScheduleCell.displayName = 'AdminScheduleCell';

export default AdminScheduleCell;
