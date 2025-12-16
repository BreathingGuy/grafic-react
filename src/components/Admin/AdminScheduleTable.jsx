import { useRef, useEffect, useState } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useDateStore } from '../../store/dateStore';
import { useAdminStore } from '../../store/adminStore';

import FixedEmployeeColumn from '../Table/Static/FixedEmployeeColumn';
import AdminScrollableTable from './AdminScrollableTable';

import styles from './AdminScheduleTable.module.css';

export default function AdminScheduleTable() {
  const scrollRef1 = useRef(null);
  const scrollRef2 = useRef(null);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const employeeIds = useScheduleStore(state => state.employeeIds);
  const currentYear = useDateStore(state => state.currentYear);
  const datesByQuarter = useDateStore(state => state.datesByQuarter);
  const editMode = useAdminStore(state => state.editMode);

  const startCell = useAdminStore(state => state.startCell);
  const setStartCell = useAdminStore(state => state.setStartCell);
  const clearSelection = useAdminStore(state => state.clearSelection);
  const selectRange = useAdminStore(state => state.selectRange);
  const copySelected = useAdminStore(state => state.copySelected);
  const pasteSelected = useAdminStore(state => state.pasteSelected);
  const undo = useAdminStore(state => state.undo);

  // Получаем даты для первого квартала (янв-фев-март)
  const q1Dates = datesByQuarter[`${currentYear}-Q1`] || [];

  // Получаем даты для второго квартала (апр-май-июнь)
  const q2Dates = datesByQuarter[`${currentYear}-Q2`] || [];

  // Синхронизация скроллинга
  const handleScroll = (sourceRef, targetRef) => {
    if (sourceRef.current && targetRef.current) {
      targetRef.current.scrollLeft = sourceRef.current.scrollLeft;
    }
  };

  // Получить все доступные ячейки для выделения
  const getAllCells = () => {
    const allCells = [];
    const allDates = [...q1Dates, ...q2Dates];

    employeeIds.forEach((empId, rowIndex) => {
      allDates.forEach((date, colIndex) => {
        allCells.push({ empId, date, rowIndex, colIndex });
      });
    });

    return allCells;
  };

  // Обработка mousedown на ячейке
  const handleMouseDown = (e) => {
    const td = e.target.closest('td[data-emp-id]');
    if (!td) return;

    e.preventDefault();
    clearSelection();

    const empId = td.dataset.empId;
    const date = td.dataset.date;
    const rowIndex = parseInt(td.dataset.rowIndex);
    const colIndex = parseInt(td.dataset.colIndex);

    const cell = { empId, date, rowIndex, colIndex };
    setStartCell(cell);
    setIsDragging(true);
  };

  // Обработка mouseup
  const handleMouseUp = (e) => {
    const td = e.target.closest('td[data-emp-id]');
    if (!td || !startCell) {
      setIsDragging(false);
      return;
    }

    e.preventDefault();

    const empId = td.dataset.empId;
    const date = td.dataset.date;
    const rowIndex = parseInt(td.dataset.rowIndex);
    const colIndex = parseInt(td.dataset.colIndex);

    const endCell = { empId, date, rowIndex, colIndex };
    selectRange(startCell, endCell, getAllCells());
    setIsDragging(false);
  };

  // Обработка mouseover для выделения диапазона
  const handleMouseOver = (e) => {
    if (!isDragging || !startCell) return;

    const td = e.target.closest('td[data-emp-id]');
    if (!td) return;

    e.preventDefault();

    const empId = td.dataset.empId;
    const date = td.dataset.date;
    const rowIndex = parseInt(td.dataset.rowIndex);
    const colIndex = parseInt(td.dataset.colIndex);

    const endCell = { empId, date, rowIndex, colIndex };
    selectRange(startCell, endCell, getAllCells());
  };

  // Обработка клавиатурных сокращений
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+C - копировать
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        copySelected();
      }

      // Ctrl+V - вставить
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        pasteSelected();
      }

      // Ctrl+Z - отменить
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [copySelected, pasteSelected, undo]);

  // Предотвращаем контекстное меню
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  if (!editMode) {
    return (
      <div className={styles.container}>
        <p>Включите режим редактирования для просмотра админской панели</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={styles.adminContainer}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseOver={handleMouseOver}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.tableSection}>
        <h3 className={styles.quarterTitle}>Квартал 1 (Январь - Март)</h3>
        <div className={styles.tableRow}>
          {/* Левая фиксированная колонка с именами */}
          <FixedEmployeeColumn />

          {/* Правая скроллируемая часть - Q1 */}
          <AdminScrollableTable
            dates={q1Dates}
            scrollRef={scrollRef1}
            onScroll={() => handleScroll(scrollRef1, scrollRef2)}
            quarter={1}
          />
        </div>
      </div>

      <div className={styles.tableSection}>
        <h3 className={styles.quarterTitle}>Квартал 2 (Апрель - Июнь)</h3>
        <div className={styles.tableRow}>
          {/* Левая фиксированная колонка с именами */}
          <FixedEmployeeColumn />

          {/* Правая скроллируемая часть - Q2 */}
          <AdminScrollableTable
            dates={q2Dates}
            scrollRef={scrollRef2}
            onScroll={() => handleScroll(scrollRef2, scrollRef1)}
            quarter={2}
          />
        </div>
      </div>
    </div>
  );
}
