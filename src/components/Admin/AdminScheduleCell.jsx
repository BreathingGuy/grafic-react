import { memo } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useAdminStore } from '../../store/adminStore';

const AdminScheduleCell = memo(({ employeeId, date, isEmpty }) => {
  // Сначала проверяем черновик, потом прод
  const draftStatus = useAdminStore(state => {
    if (!date || isEmpty) return '';
    const key = `${employeeId}-${date}`;
    return state.draftSchedule[key];
  });

  const prodStatus = useScheduleStore(state => {
    if (!date || isEmpty) return '';
    const key = `${employeeId}-${date}`;
    return state.scheduleMap[key] || '';
  });

  // Приоритет: draft > prod > пусто
  const status = draftStatus !== undefined ? draftStatus : prodStatus;
  const isDraft = draftStatus !== undefined;

  // Всегда показываем ячейку (пустую если нет данных)
  return (
    <td style={{
      backgroundColor: isDraft ? '#fff3cd' : undefined,
      cursor: 'pointer'
    }}>
      {status}
    </td>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.employeeId === nextProps.employeeId &&
    prevProps.date === nextProps.date &&
    prevProps.isEmpty === nextProps.isEmpty
  );
});

AdminScheduleCell.displayName = 'AdminScheduleCell';

export default AdminScheduleCell;
