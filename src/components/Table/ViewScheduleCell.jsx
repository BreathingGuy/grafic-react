import { memo } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';


const ViewScheduleCell = memo(({ employeeId, date}) => {
  const key = `${employeeId}-${date}`;
  
    const status = useScheduleStore(state => {
      return state.scheduleMap[key] || '';
    });

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

ViewScheduleCell.displayName = 'ViewScheduleCell';

export default ViewScheduleCell;