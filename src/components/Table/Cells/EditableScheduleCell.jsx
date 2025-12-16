import { memo, useState, useMemo, useCallback } from 'react';
import { useScheduleStore } from '../../../store/scheduleStore';
import { useAdminStore } from '../../../store/adminStore';
import CellEditor from './CellEditor';

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
 * EditableScheduleCell - Полнофункциональная версия ячейки с редактированием (АДМИНЫ)
 *
 * ФУНКЦИОНАЛЬНОСТЬ:
 * - Отображение статусов с цветной подсветкой
 * - Режим редактирования с CellEditor
 * - Поддержка черновиков (draftSchedule из adminStore)
 * - Подсветка изменённых ячеек
 * - Обработка кликов и изменений
 *
 * @param {string} employeeId - ID сотрудника
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @param {boolean} isEmpty - Флаг пустой ячейки (не загружать данные)
 */
const EditableScheduleCell = memo(({ employeeId, date, isEmpty }) => {
  // === МЕМОИЗАЦИЯ КЛЮЧА ===
  const key = useMemo(() => `${employeeId}-${date}`, [employeeId, date]);

  // === ПОДПИСКИ НА STORE ===

  // Получаем статус из черновика (adminStore) или прода (scheduleStore)
  const draftStatus = useAdminStore(state => {
    if (isEmpty) return undefined;
    return state.draftSchedule[key];
  });

  const prodStatus = useScheduleStore(state => {
    if (isEmpty) return '';
    return state.scheduleMap[key] || '';
  });

  // Проверка изменённых ячеек (для подсветки после публикации)
  const isChanged = useAdminStore(state => state.changedCells?.has(key) || false);

  // Метод обновления черновика
  const updateDraftCell = useAdminStore(state => state.updateDraftCell);

  // Приоритет: draft > prod > пусто
  const status = draftStatus !== undefined ? draftStatus : prodStatus;
  const isDraft = draftStatus !== undefined;

  // === ЛОКАЛЬНОЕ СОСТОЯНИЕ ===
  const [isEditing, setIsEditing] = useState(false);

  // === МЕМОИЗИРОВАННЫЕ ВЫЧИСЛЕНИЯ ===

  // Стили ячейки
  const cellStyle = useMemo(() => ({
    backgroundColor: STATUS_COLORS[status] || (isDraft ? '#fffde7' : ''),
    color: WHITE_TEXT_STATUSES.has(status) ? 'white' : 'black',
    cursor: 'pointer',
    opacity: isEditing ? 1 : 0.95,
    outline: isChanged ? '2px solid #4caf50' : 'none',
  }), [status, isDraft, isEditing, isChanged]);

  // === ОБРАБОТЧИКИ ===

  const handleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleChange = useCallback((newStatus) => {
    updateDraftCell(employeeId, date, newStatus);
    setIsEditing(false);
  }, [updateDraftCell, employeeId, date]);

  // === РЕНДЕР ===

  return (
    <td
      onClick={handleClick}
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
  return (
    prevProps.employeeId === nextProps.employeeId &&
    prevProps.date === nextProps.date &&
    prevProps.isEmpty === nextProps.isEmpty
  );
});

EditableScheduleCell.displayName = 'EditableScheduleCell';

export default EditableScheduleCell;