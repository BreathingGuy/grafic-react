import { memo, useState } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useAdminStore } from '../../store/adminStore';
import CellEditor from './CellEditor';
import styles from './Table.module.css';

const ScheduleCell = memo(({ employeeId, date }) => {
  // PROPS:
  // - employeeId: 10001 (примитив, не меняется)
  // - date: "2025-01-15" (примитив, не меняется)

  // ZUSTAND - подписка на КОНКРЕТНОЕ значение:
  const status = useScheduleStore(state => {
    const key = `${employeeId}-${date}`;
    const editMode = useAdminStore.getState().editMode;

    // Если режим редактирования - показываем черновик, иначе production
    if (editMode && state.draftSchedule[key] !== undefined) {
      return state.draftSchedule[key];
    }
    return state.scheduleMap[key] || '';
  });

  // ZUSTAND - проверка подсветки изменений:
  const isChanged = useScheduleStore(state =>
    state.changedCells.has(`${employeeId}-${date}`)
  );

  // ZUSTAND - функции действий:
  const updateCell = useScheduleStore(state => state.updateCell);
  const editMode = useAdminStore(state => state.editMode);

  const [isEditing, setIsEditing] = useState(false);

  const handleClick = () => {
    if (editMode) {
      setIsEditing(true);
    }
  };

  // Определяем цвет фона
  const getBackgroundColor = (status) => {
    switch(status) {
      case 'Д': return '#d4edda'; // green
      case 'В': return '#f8d7da'; // red
      case 'У': return '#fff3cd'; // yellow
      case 'О':
      case 'ОВ': return '#d1ecf1'; // blue
      case 'Н1':
      case 'Н2': return '#9c27b0'; // purple
      case 'ЭУ': return '#ff9800'; // orange
      default: return '';
    }
  };

  // Определяем цвет текста
  const getTextColor = (status) => {
    return (status === 'Н1' || status === 'Н2' || status === 'ЭУ') ? 'white' : 'black';
  };

  const cellStyle = {
    backgroundColor: getBackgroundColor(status),
    color: getTextColor(status),
    cursor: editMode ? 'pointer' : 'default',
    opacity: editMode && !isEditing ? 0.9 : 1,
  };

  return (
    <td
      onClick={handleClick}
      className={`${styles.scheduleCell} ${isChanged ? styles.changed : ''}`}
      style={cellStyle}
    >
      {isEditing ? (
        <CellEditor
          value={status}
          onChange={(newStatus) => {
            updateCell(employeeId, date, newStatus);
            setIsEditing(false);
          }}
          onClose={() => setIsEditing(false)}
        />
      ) : (
        status
      )}
    </td>
  );
}, (prevProps, nextProps) => {
  // Сравниваем только примитивы (очень быстро!)
  return (
    prevProps.employeeId === nextProps.employeeId &&
    prevProps.date === nextProps.date
  );
});

ScheduleCell.displayName = 'ScheduleCell';

export default ScheduleCell;