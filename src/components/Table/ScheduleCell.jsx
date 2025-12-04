import { memo, useState } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useAdminStore } from '../../store/adminStore';
import CellEditor from './CellEditor';
import styles from './Table.module.css';

const ScheduleCell = memo(({ employeeId, date }) => {
  // === PROPS ===
  // - employeeId: "1000" (строка, примитив - не меняется)
  // - date: "2025-01-15" (строка YYYY-MM-DD, примитив - не меняется)

  // === ZUSTAND ПОДПИСКИ ===

  // Подписка на статус конкретной ячейки
  // ВАЖНО: используем селектор, чтобы компонент обновлялся только при изменении ЭТОЙ ячейки
  const status = useScheduleStore(state => {
    const key = `${employeeId}-${date}`;
    const editMode = useAdminStore.getState().editMode;

    // В режиме редактирования показываем черновик
    if (editMode && state.draftSchedule && state.draftSchedule[key] !== undefined) {
      return state.draftSchedule[key];
    }

    // Иначе показываем production данные
    return state.scheduleMap[key] || '';
  });

  // Подписка на подсветку изменений (после публикации)
  const isChanged = useScheduleStore(state =>
    state.changedCells && state.changedCells.has(`${employeeId}-${date}`)
  );

  // Подписка на функцию обновления
  const updateCell = useScheduleStore(state => state.updateCell);

  // Подписка на режим редактирования
  const editMode = useAdminStore(state => state.editMode);

  // === ЛОКАЛЬНОЕ СОСТОЯНИЕ ===

  // Флаг - редактируется ли ячейка ПРЯМО СЕЙЧАС (dropdown открыт)
  const [isEditing, setIsEditing] = useState(false);

  // === ОБРАБОТЧИКИ ===

  const handleClick = () => {
    // Открываем dropdown только в режиме редактирования
    if (editMode) {
      setIsEditing(true);
    }
  };

  // === HELPERS ДЛЯ СТИЛИЗАЦИИ ===

  // Определяем цвет фона на основе статуса
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
  // === ОПТИМИЗАЦИЯ REACT.MEMO ===

  // Компонент НЕ обновляется если:
  // 1. employeeId не изменился (тот же сотрудник)
  // 2. date не изменился (та же дата)
  //
  // Почему это работает:
  // - employeeId и date - примитивы (строки)
  // - Сравнение примитивов очень быстрое
  // - Zustand selector уже подписан на конкретную ячейку
  //
  // Результат: при изменении 1 ячейки из 9000 - обновится только 1 компонент

  return (
    prevProps.employeeId === nextProps.employeeId &&
    prevProps.date === nextProps.date
  );
});

ScheduleCell.displayName = 'ScheduleCell';

export default ScheduleCell;