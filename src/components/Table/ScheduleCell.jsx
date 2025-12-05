import { memo, useState, useMemo, useCallback } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useAdminStore } from '../../store/adminStore';
import CellEditor from './CellEditor';
import styles from './Table.module.css';

// === ВЫНЕСЛИ ЗА ПРЕДЕЛЫ КОМПОНЕНТА - создаются только 1 раз ===

// Маппинг цветов фона для статусов
const STATUS_COLORS = {
  'Д': '#d4edda',   // Дневная смена - зелёный
  'В': '#f8d7da',   // Выходной - красный
  'У': '#fff3cd',   // Учёба - жёлтый
  'О': '#d1ecf1',   // Отпуск - голубой
  'ОВ': '#d1ecf1',  // Отпуск - голубой
  'Н1': '#9c27b0',  // Ночная смена - фиолетовый
  'Н2': '#9c27b0',  // Ночная смена - фиолетовый
  'ЭУ': '#ff9800',  // Экстра часы - оранжевый
};

// Статусы с белым текстом (тёмный фон)
const WHITE_TEXT_STATUSES = new Set(['Н1', 'Н2', 'ЭУ']);

const ScheduleCell = memo(({ employeeId, date }) => {
  // === PROPS ===
  // - employeeId: "1000" (строка, примитив)
  // - date: "2025-01-15" (строка YYYY-MM-DD, примитив)

  // === МЕМОИЗАЦИЯ КЛЮЧА ===
  // Ключ создаётся только 1 раз при монтировании (employeeId и date не меняются)
  const key = useMemo(() => `${employeeId}-${date}`, [employeeId, date]);

  // === ОПТИМИЗИРОВАННАЯ ПОДПИСКА ZUSTAND ===
  // Вместо 4 подписок - только 2 (scheduleStore + adminStore)

  // Подписка #1: Получаем status и isChanged за один раз
  const { status, isChanged } = useScheduleStore(state => {
    const editMode = useAdminStore.getState().editMode;

    return {
      status: editMode && state.draftSchedule?.[key] !== undefined
        ? state.draftSchedule[key]
        : state.scheduleMap[key] || '',
      isChanged: state.changedCells?.has(key) || false
    };
  });

  // Подписка #2: editMode и updateCell (нужны для UI logic)
  const editMode = useAdminStore(state => state.editMode);
  const updateCell = useScheduleStore(state => state.updateCell);

  // === ЛОКАЛЬНОЕ СОСТОЯНИЕ ===
  const [isEditing, setIsEditing] = useState(false);

  // === МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ ===

  // Стили ячейки - пересчитываются только при изменении зависимостей
  const cellStyle = useMemo(() => ({
    backgroundColor: STATUS_COLORS[status] || '',
    color: WHITE_TEXT_STATUSES.has(status) ? 'white' : 'black',
    cursor: editMode ? 'pointer' : 'default',
    opacity: editMode && !isEditing ? 0.9 : 1,
  }), [status, editMode, isEditing]);

  // className - пересчитывается только при изменении isChanged
  const cellClassName = useMemo(() =>
    isChanged
      ? `${styles.scheduleCell} ${styles.changed}`
      : styles.scheduleCell,
    [isChanged]
  );

  // === МЕМОИЗИРОВАННЫЕ ОБРАБОТЧИКИ ===

  // handleClick - создаётся только при изменении editMode
  const handleClick = useCallback(() => {
    if (editMode) {
      setIsEditing(true);
    }
  }, [editMode]);

  // handleChange - создаётся только при изменении updateCell
  const handleChange = useCallback((newStatus) => {
    updateCell(employeeId, date, newStatus);
    setIsEditing(false);
  }, [updateCell, employeeId, date]);

  // === РЕНДЕР ===

  return (
    <td
      onClick={handleClick}
      className={cellClassName}
      style={cellStyle}
    >
      {isEditing ? (
        <CellEditor
          value={status}
          onChange={handleChange}
          onClose={() => setIsEditing(false)}
        />
      ) : (
        status
      )}
    </td>
  );
}, (prevProps, nextProps) => {
  // === ОПТИМИЗАЦИЯ REACT.MEMO ===
  // Компонент НЕ обновляется если props не изменились
  return (
    prevProps.employeeId === nextProps.employeeId &&
    prevProps.date === nextProps.date
  );
});

ScheduleCell.displayName = 'ScheduleCell';

export default ScheduleCell;