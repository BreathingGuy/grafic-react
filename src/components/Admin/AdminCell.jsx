import { useRef, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { STATUS_COLORS } from '../../constants/index';

import styles from './AdminScheduleTable.module.css';

export default function AdminCell({ empId, date, rowIndex, colIndex }) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  const draftSchedule = useAdminStore(state => state.draftSchedule);
  const updateDraftCell = useAdminStore(state => state.updateDraftCell);
  const isCellSelected = useAdminStore(state => state.isCellSelected);

  const key = `${empId}-${date}`;
  const value = draftSchedule[key] || '';

  const isSelected = isCellSelected(empId, date);

  // Определяем цвет фона на основе статуса
  const getBackgroundColor = (status) => {
    if (!status) return '#fff';

    const colorClass = STATUS_COLORS[status];
    if (!colorClass) return '#fff';

    // Простая карта цветов (можно расширить)
    const colorMap = {
      'working-day': '#d4edda',
      'day-off': '#f8d7da',
      'study': '#fff3cd',
      'vacation': '#d1ecf1',
      'night-shift': '#e2d9f3',
      'extra-hours': '#ffe5b4'
    };

    return colorMap[colorClass] || '#fff';
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleChange = (e) => {
    updateDraftCell(empId, date, e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <td
      className={`${styles.adminCell} ${isSelected ? styles.selected : ''}`}
      style={{ backgroundColor: getBackgroundColor(value) }}
      onDoubleClick={handleDoubleClick}
      data-emp-id={empId}
      data-date={date}
      data-row-index={rowIndex}
      data-col-index={colIndex}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={styles.cellInput}
        />
      ) : (
        <span>{value}</span>
      )}
    </td>
  );
}
