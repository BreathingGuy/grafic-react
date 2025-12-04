import { memo, useState } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useAdminStore } from '../../store/adminStore';
import CellEditor from './CellEditor';
import styles from './Table.module.css';

const ScheduleCell = memo(({ employeeId, date }) => {
  const status = useScheduleStore(state => {
    const key = `${employeeId}-${date}`;
    const editMode = useAdminStore.getState().editMode;

    if (editMode && state.draftSchedule && state.draftSchedule[key] !== undefined) {
      return state.draftSchedule[key];
    }

    return state.scheduleMap[key] || '';
  });
  const isChanged = useScheduleStore(state =>
    state.changedCells && state.changedCells.has(`${employeeId}-${date}`)
  );
  const updateCell = useScheduleStore(state => state.updateCell);
  const editMode = useAdminStore(state => state.editMode);

  // === ЛОКАЛЬНОЕ СОСТОЯНИЕ ===
  const [isEditing, setIsEditing] = useState(false);
  const handleClick = () => {
    if (editMode) {
      setIsEditing(true);
    }
  };

  const getBackgroundColor = (status) => {
    switch(status) {
      case 'Д': return '#d4edda';   // Дневная смена - зелёный
      case 'В': return '#f8d7da';   // Выходной - красный
      case 'У': return '#fff3cd';   // Учёба - жёлтый
      case 'О':
      case 'ОВ': return '#d1ecf1';  // Отпуск - голубой
      case 'Н1':
      case 'Н2': return '#9c27b0';  // Ночная смена - фиолетовый
      case 'ЭУ': return '#ff9800';  // Экстра часы - оранжевый
      default: return '';           // Пустая ячейка - без фона
    }
  };

  // Определяем цвет текста (для тёмного фона нужен белый текст)
  const getTextColor = (status) => {
    return (status === 'Н1' || status === 'Н2' || status === 'ЭУ') ? 'white' : 'black';
  };

  // Собираем inline стили для ячейки
  const cellStyle = {
    backgroundColor: getBackgroundColor(status),
    color: getTextColor(status),
    cursor: editMode ? 'pointer' : 'default', // В режиме редактирования - курсор pointer
    opacity: editMode && !isEditing ? 0.9 : 1, // Слегка прозрачно в edit mode
  };

  // === РЕНДЕР ===

  return (
    <td
      onClick={handleClick}
      className={`${styles.scheduleCell} ${isChanged ? styles.changed : ''}`}
      style={cellStyle}
    >
      {isEditing ? (
        // Режим редактирования - показываем dropdown
        <CellEditor
          value={status}
          onChange={(newStatus) => {
            // Обновляем ячейку через store action
            updateCell(employeeId, date, newStatus);
            // Закрываем dropdown
            setIsEditing(false);
          }}
          onClose={() => setIsEditing(false)}
        />
      ) : (
        // Обычный режим - просто показываем статус
        status
      )}
    </td>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.employeeId === nextProps.employeeId &&
    prevProps.date === nextProps.date
  );
});

ScheduleCell.displayName = 'ScheduleCell';

export default ScheduleCell;