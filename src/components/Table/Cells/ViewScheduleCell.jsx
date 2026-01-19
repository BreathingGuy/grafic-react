import { memo, useMemo } from 'react';
import { useScheduleStore } from '../../../store/scheduleStore';
import { useDateStore } from '../../../store/dateStore';
import { useMetaStore } from '../../../store/metaStore';

const ViewScheduleCell = memo(({ employeeId, slotIndex}) => {
  const date = useDateStore(state => state.slotToDate[slotIndex]);

  const status = useScheduleStore(state => {
    if (!date) return '';  // Если дата не определена, ячейка пустая
    const key = `${employeeId}-${date}`;
    return state.scheduleMap[key] || '';
  });

  // Получаем конфигурацию статусов из metaStore
  const statusConfig = useMetaStore(state => state.currentDepartmentConfig?.statusConfig);

  // Вычисляем стили на основе конфигурации статусов
  const cellStyle = useMemo(() => {
    if (!status || !statusConfig) return {};

    // Ищем конфигурацию для текущего статуса
    const config = statusConfig.find(s =>
      s.codeList === status || s.code === status
    );

    if (!config) return {};

    return {
      backgroundColor: config.colorBackground || config.color || undefined,
      color: config.colorText || undefined
    };
  }, [status, statusConfig]);

  if (!date) return null;

  return (
    <td style={cellStyle}>
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