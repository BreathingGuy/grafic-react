import { memo } from 'react';
import { useScheduleStore } from '../../../store/scheduleStore';
import { useDateStore } from '../../../store/dateStore';

const ViewScheduleCell = memo(({ employeeId, slotIndex}) => {
  const date = useDateStore(state => state.slotToDate[slotIndex]);
  
  const status = useScheduleStore(state => {
    if (!date) return '';  // Если дата не определена, ячейка пустая
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

ViewScheduleCell.displayName = 'ViewScheduleCell';

export default ViewScheduleCell;