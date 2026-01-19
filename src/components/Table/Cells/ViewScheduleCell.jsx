import { memo, useMemo } from 'react';
import { useScheduleStore } from '../../../store/scheduleStore';
import { useDateStore } from '../../../store/dateStore';
import { useMetaStore } from '../../../store/metaStore';
import { getContrastColor, hasGoodContrast } from '../../../utils/colorHelpers';

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

    const bgColor = config.colorBackground || config.color;
    let textColor = config.colorText;

    // Если цвет текста не задан или имеет плохой контраст - вычисляем автоматически
    if (!textColor || (bgColor && !hasGoodContrast(textColor, bgColor))) {
      textColor = bgColor ? getContrastColor(bgColor) : '#000000';
    }

    return {
      backgroundColor: bgColor || undefined,
      color: textColor || undefined
    };
  }, [status, statusConfig]);

  if (!date) return null;

  return (
    <td style={cellStyle}>
      {status}
    </td>
  );
});

ViewScheduleCell.displayName = 'ViewScheduleCell';

export default ViewScheduleCell;