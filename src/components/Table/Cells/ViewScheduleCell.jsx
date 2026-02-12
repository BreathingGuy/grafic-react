import { memo } from 'react';
import { useScheduleStore } from '../../../store/scheduleStore';
import { useMetaStore } from '../../../store/metaStore';
import { useDateStore } from '../../../store/dateStore';

const ViewScheduleCell = memo(({ employeeId, slotIndex}) => {
  const date = useDateStore(state => state.slotToDate[slotIndex]);

  const status = useScheduleStore(state => {
    if (!date) return '';  // Если дата не определена, ячейка пустая
    const key = `${employeeId}-${date}`;
    return state.scheduleMap[key] || '';
  });

  const colorBack = useMetaStore(state => state.statusColorMap?.[status]?.colorBack);
  const colorText = useMetaStore(state => state.statusColorMap?.[status]?.colorText);

  if (!date) return null;

  return (
    <td style={{ backgroundColor: colorBack, color: colorText }}>
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