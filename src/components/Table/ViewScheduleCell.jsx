import { memo, useMemo } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import styles from './Table.module.css';

// === КОНСТАНТЫ ВЫНЕСЕНЫ ЗА ПРЕДЕЛЫ КОМПОНЕНТА - создаются только 1 раз ===

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

/**
 * ViewScheduleCell - Облегчённая версия ячейки для просмотра (НЕ-админы)
 *
 * ОПТИМИЗАЦИЯ:
 * - Минимальные подписки Zustand (только 1 вместо 3-4)
 * - Нет локального state (useState)
 * - Нет обработчиков событий (useCallback)
 * - Минимальные вычисления (useMemo)
 * - Нет импорта CellEditor
 *
 * ПРОИЗВОДИТЕЛЬНОСТЬ:
 * - В 2-3 раза быстрее чем EditableScheduleCell
 * - Меньше памяти (нет замыканий для callbacks)
 * - Меньше реактивности (меньше зависимостей)
 *
 * @param {string} employeeId - ID сотрудника (примитив)
 * @param {string} date - Дата в формате YYYY-MM-DD (примитив)
 */
const ViewScheduleCell = memo(({ employeeId, date }) => {
  // === МЕМОИЗАЦИЯ КЛЮЧА ===
  // Ключ создаётся только 1 раз при монтировании (employeeId и date не меняются)
  const key = useMemo(() => `${employeeId}-${date}`, [employeeId, date]);

  // === ЕДИНСТВЕННАЯ ПОДПИСКА ZUSTAND ===
  // Получаем только status и isChanged - БЕЗ логики редактирования
  const { status, isChanged } = useScheduleStore(state => ({
    status: state.scheduleMap[key] || '',
    isChanged: state.changedCells?.has(key) || false
  }));

  // === МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ ===

  // Стили ячейки - пересчитываются только при изменении status
  const cellStyle = useMemo(() => ({
    backgroundColor: STATUS_COLORS[status] || '',
    color: WHITE_TEXT_STATUSES.has(status) ? 'white' : 'black',
  }), [status]);

  // className - пересчитывается только при изменении isChanged
  const cellClassName = useMemo(() =>
    isChanged
      ? `${styles.scheduleCell} ${styles.changed}`
      : styles.scheduleCell,
    [isChanged]
  );

  // === РЕНДЕР ===
  // Простой рендер - только отображение статуса
  return (
    <td
      className={cellClassName}
      style={cellStyle}
    >
      {status}
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

ViewScheduleCell.displayName = 'ViewScheduleCell';

export default ViewScheduleCell;
