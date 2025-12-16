import { useRef, useCallback, useMemo, memo, useState } from 'react';
import { FixedSizeGrid, FixedSizeList } from 'react-window';
import { useScheduleStore } from '../../store/scheduleStore';
import { useAdminStore } from '../../store/adminStore';
import { useDateStore } from '../../store/dateStore';
import CellEditor from '../Table/Cells/CellEditor';
import { MONTHS } from '../../constants/index';

import styles from './VirtualizedAdminTable.module.css';

// Размеры ячеек
const CELL_WIDTH = 28;
const CELL_HEIGHT = 24;
const ROW_HEIGHT = CELL_HEIGHT;
const EMPLOYEE_COLUMN_WIDTH = 200;
const HEADER_HEIGHT = 50; // Высота заголовков (месяцы + дни)

// Цвета статусов
const STATUS_COLORS = {
  'Д': '#d4edda',
  'В': '#f8d7da',
  'У': '#fff3cd',
  'О': '#d1ecf1',
  'ОВ': '#d1ecf1',
  'Н1': '#9c27b0',
  'Н2': '#9c27b0',
  'ЭУ': '#ff9800',
};

const WHITE_TEXT_STATUSES = new Set(['Н1', 'Н2', 'ЭУ']);

// Ячейка графика
const ScheduleCell = memo(({
  employeeId,
  date,
  isEmpty,
  style,
  isEditing,
  onStartEdit,
  onEndEdit
}) => {
  const key = `${employeeId}-${date}`;

  const draftStatus = useAdminStore(state => {
    if (isEmpty) return undefined;
    return state.draftSchedule[key];
  });

  const prodStatus = useScheduleStore(state => {
    if (isEmpty) return '';
    return state.scheduleMap[key] || '';
  });

  const updateDraftCell = useAdminStore(state => state.updateDraftCell);

  const status = draftStatus !== undefined ? draftStatus : prodStatus;
  const isDraft = draftStatus !== undefined;

  const cellStyle = {
    ...style,
    backgroundColor: STATUS_COLORS[status] || (isDraft ? '#fffde7' : '#fff'),
    color: WHITE_TEXT_STATUSES.has(status) ? 'white' : 'black',
    border: '1px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '11px',
    boxSizing: 'border-box',
  };

  const handleClick = () => {
    onStartEdit(employeeId, date, key);
  };

  const handleChange = (newStatus) => {
    updateDraftCell(employeeId, date, newStatus);
    onEndEdit();
  };

  if (isEditing) {
    return (
      <div style={cellStyle}>
        <CellEditor
          value={status}
          onChange={handleChange}
          onClose={onEndEdit}
        />
      </div>
    );
  }

  return (
    <div style={cellStyle} onClick={handleClick}>
      {status}
    </div>
  );
});

ScheduleCell.displayName = 'ScheduleCell';

// Основной компонент виртуализированной таблицы
export default function VirtualizedAdminTable({ topDates, bottomDates, emptyFromIndex }) {
  const employeeIds = useScheduleStore(state => state.employeeIds);
  const employeeById = useScheduleStore(state => state.employeeById);
  const dateDays = useDateStore(state => state.dateDays);

  // Состояние редактирования
  const [editingCell, setEditingCell] = useState(null);

  // Refs для синхронизации скролла
  const gridRef = useRef(null);
  const employeeListRef = useRef(null);
  const headerRef = useRef(null);

  // Общее количество колонок (дней)
  const columnCount = topDates.length;

  // Количество строк = сотрудники × 2 (верхняя + нижняя таблица)
  const rowCount = employeeIds.length * 2;

  // Синхронизация вертикального скролла
  const handleGridScroll = useCallback(({ scrollTop, scrollLeft }) => {
    if (employeeListRef.current) {
      employeeListRef.current.scrollTo(scrollTop);
    }
    if (headerRef.current) {
      headerRef.current.scrollLeft = scrollLeft;
    }
  }, []);

  // Обработчики редактирования
  const handleStartEdit = useCallback((employeeId, date, key) => {
    setEditingCell({ employeeId, date, key });
  }, []);

  const handleEndEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  // Вычисляем группы месяцев для заголовка
  const monthGroups = useMemo(() => {
    if (!topDates || topDates.length === 0) return [];

    const groups = [];
    let currentMonth = null;
    let startIndex = 0;
    let colspan = 0;

    topDates.forEach((dateStr, index) => {
      const [year, month] = dateStr.split('-');
      const monthKey = `${year}-${month}`;

      if (monthKey !== currentMonth) {
        if (colspan > 0 && currentMonth !== null) {
          const [, prevMonth] = currentMonth.split('-');
          groups.push({
            month: MONTHS[parseInt(prevMonth) - 1],
            startIndex,
            colspan
          });
        }
        currentMonth = monthKey;
        startIndex = index;
        colspan = 1;
      } else {
        colspan++;
      }
    });

    if (colspan > 0 && currentMonth !== null) {
      const [, prevMonth] = currentMonth.split('-');
      groups.push({
        month: MONTHS[parseInt(prevMonth) - 1],
        startIndex,
        colspan
      });
    }

    return groups;
  }, [topDates]);

  // Рендер ячейки сетки
  const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
    const employeeIndex = Math.floor(rowIndex / 2);
    const isBottomRow = rowIndex % 2 === 1;
    const employeeId = employeeIds[employeeIndex];

    if (!employeeId) return null;

    // Для верхней строки используем topDates, для нижней - bottomDates
    const dates = isBottomRow ? bottomDates : topDates;
    const date = dates[columnIndex];

    if (!date) return <div style={style} />;

    // Проверяем, пустая ли ячейка (для нижней таблицы после emptyFromIndex)
    const isEmpty = isBottomRow && emptyFromIndex !== undefined && columnIndex >= emptyFromIndex;

    const isEditing = editingCell &&
      editingCell.employeeId === employeeId &&
      editingCell.date === date;

    return (
      <ScheduleCell
        employeeId={employeeId}
        date={date}
        isEmpty={isEmpty}
        style={style}
        isEditing={isEditing}
        onStartEdit={handleStartEdit}
        onEndEdit={handleEndEdit}
      />
    );
  }, [employeeIds, topDates, bottomDates, emptyFromIndex, editingCell, handleStartEdit, handleEndEdit]);

  // Рендер строки сотрудника (имя)
  const EmployeeRow = useCallback(({ index, style }) => {
    const employeeIndex = Math.floor(index / 2);
    const isBottomRow = index % 2 === 1;
    const employeeId = employeeIds[employeeIndex];
    const employee = employeeById[employeeId];

    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '10px',
          borderBottom: '1px solid #ddd',
          borderRight: '1px solid #ccc',
          backgroundColor: isBottomRow ? '#f9f9f9' : '#fff',
          fontSize: '12px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {isBottomRow ? '' : (employee?.name || employeeId)}
      </div>
    );
  }, [employeeIds, employeeById]);

  // Размеры контейнера
  const containerHeight = 600;
  const gridWidth = Math.min(window.innerWidth - EMPLOYEE_COLUMN_WIDTH - 50, columnCount * CELL_WIDTH);
  const gridHeight = containerHeight - HEADER_HEIGHT;

  return (
    <div className={styles.container}>
      {/* Заголовки */}
      <div className={styles.headerContainer}>
        {/* Пустое место над колонкой сотрудников */}
        <div
          className={styles.employeeHeaderPlaceholder}
          style={{ width: EMPLOYEE_COLUMN_WIDTH, height: HEADER_HEIGHT }}
        />

        {/* Заголовки с месяцами и днями */}
        <div
          ref={headerRef}
          className={styles.headerScroll}
          style={{ width: gridWidth, height: HEADER_HEIGHT }}
        >
          <div style={{ width: columnCount * CELL_WIDTH }}>
            {/* Месяцы */}
            <div className={styles.monthRow}>
              {monthGroups.map((group, i) => (
                <div
                  key={i}
                  className={styles.monthCell}
                  style={{
                    left: group.startIndex * CELL_WIDTH,
                    width: group.colspan * CELL_WIDTH,
                  }}
                >
                  {group.month}
                </div>
              ))}
            </div>
            {/* Дни */}
            <div className={styles.dayRow}>
              {topDates.map((date, index) => (
                <div
                  key={index}
                  className={styles.dayCell}
                  style={{ width: CELL_WIDTH }}
                >
                  {dateDays[date] || ''}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className={styles.bodyContainer}>
        {/* Колонка с именами сотрудников */}
        <FixedSizeList
          ref={employeeListRef}
          height={gridHeight}
          width={EMPLOYEE_COLUMN_WIDTH}
          itemCount={rowCount}
          itemSize={ROW_HEIGHT}
          style={{ overflow: 'hidden' }}
        >
          {EmployeeRow}
        </FixedSizeList>

        {/* Виртуализированная сетка */}
        <FixedSizeGrid
          ref={gridRef}
          columnCount={columnCount}
          columnWidth={CELL_WIDTH}
          height={gridHeight}
          rowCount={rowCount}
          rowHeight={ROW_HEIGHT}
          width={gridWidth}
          onScroll={handleGridScroll}
        >
          {Cell}
        </FixedSizeGrid>
      </div>
    </div>
  );
}
