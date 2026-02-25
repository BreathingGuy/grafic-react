import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAdminStore } from '../../store/admin';
import { useMetaStore } from '../../store/metaStore';
import { useClipboardStore } from '../../store/selection';
import styles from './Table.module.css';

// Вычислить стиль для одного региона выделения
function computeRegionStyle(startCell, endCell, employeeIds, tableRef) {
  if (!startCell || !endCell || !tableRef?.current) return null;

  const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
  const endEmpIdx = employeeIds.indexOf(endCell.employeeId);

  const minEmpIdx = Math.min(startEmpIdx, endEmpIdx);
  const maxEmpIdx = Math.max(startEmpIdx, endEmpIdx);
  const minSlot = Math.min(startCell.slotIndex, endCell.slotIndex);
  const maxSlot = Math.max(startCell.slotIndex, endCell.slotIndex);

  const topLeftCell = tableRef.current.querySelector(
    `[data-emp-idx="${minEmpIdx}"][data-slot="${minSlot}"]`
  );
  const bottomRightCell = tableRef.current.querySelector(
    `[data-emp-idx="${maxEmpIdx}"][data-slot="${maxSlot}"]`
  );

  if (!topLeftCell || !bottomRightCell) return null;

  const containerRect = tableRef.current.getBoundingClientRect();
  const topLeftRect = topLeftCell.getBoundingClientRect();
  const bottomRightRect = bottomRightCell.getBoundingClientRect();

  return {
    position: 'absolute',
    left: topLeftRect.left - containerRect.left,
    top: topLeftRect.top - containerRect.top,
    width: bottomRightRect.right - topLeftRect.left,
    height: bottomRightRect.bottom - topLeftRect.top,
    border: '2px solid #1976d2',
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    pointerEvents: 'none',
    zIndex: 10,
    boxSizing: 'border-box'
  };
}

/**
 * SelectionOverlay - Оверлей для визуализации выделения
 * @param {Object} tableRef - ref на таблицу
 * @param {Function} useSelectionStore - хук selection store (useMainSelectionStore или useOffsetSelectionStore)
 * @param {Object} slotToDate - маппинг слотов к датам (для offset таблицы передаётся offsetSlotToDate)
 */
function SelectionOverlay({ tableRef, useSelectionStore, slotToDate: slotToDateProp }) {
  const [regionStyles, setRegionStyles] = useState([]);
  const [editorPosition, setEditorPosition] = useState(null);
  const [hoveredValue, setHoveredValue] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const menuRef = useRef(null);

  // Статусы из конфига отдела
  const currentConfig = useMetaStore(s => s.currentDepartmentConfig);
  const statusOptions = useMemo(() => {
    const options = [{ value: '', label: '-' }];
    if (currentConfig?.statusConfig) {
      currentConfig.statusConfig.forEach(s => {
        options.push({ value: s.code, label: `${s.code} (${s.label})` });
      });
    }
    return options;
  }, [currentConfig]);

  // Подписываемся на все выделения из переданного стора
  const startCell = useSelectionStore(s => s.startCell);
  const endCell = useSelectionStore(s => s.endCell);
  const selections = useSelectionStore(s => s.selections);
  const isDragging = useSelectionStore(s => s.isDragging);

  // Clipboard из общего стора
  const hasCopiedData = useClipboardStore(s => s.hasCopiedData);

  // Object.is для сравнения ссылок — предотвращает ре-рендер при изменении других полей стора
  const employeeIds = useAdminStore(s => s.employeeIds, Object.is);

  // slotToDate передаётся как проп (main или offset)
  const slotToDate = slotToDateProp;

  // RAF ref для отмены предыдущего незавершённого запроса
  const rafRef = useRef(null);

  // Пересчитываем позиции всех регионов
  // Использует RAF: если функция вызвана несколько раз подряд (mouseover во время drag),
  // предыдущий запрос отменяется — DOM-запросы выполняются не чаще ~60 раз/с
  const updateOverlayPositions = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;

      if (!tableRef?.current) {
        setRegionStyles([]);
        setEditorPosition(null);
        return;
      }

      const allStyles = [];

      // Добавляем стили для сохранённых выделений
      for (const sel of selections) {
        const style = computeRegionStyle(sel.startCell, sel.endCell, employeeIds, tableRef);
        if (style) allStyles.push(style);
      }

      // Добавляем текущее активное выделение
      if (startCell && endCell) {
        const style = computeRegionStyle(startCell, endCell, employeeIds, tableRef);
        if (style) {
          allStyles.push(style);

          // Позиция редактора - справа от последнего выделения (fixed относительно viewport)
          const tableRect = tableRef.current.getBoundingClientRect();
          const editorLeft = tableRect.left + style.left + style.width + 2;
          const editorTop = tableRect.top + style.top;

          // Проверяем, не выходит ли редактор за правый край экрана
          const viewportWidth = window.innerWidth;
          const editorWidth = 150; // примерная ширина редактора
          const adjustedLeft = editorLeft + editorWidth > viewportWidth
            ? tableRect.left + style.left - editorWidth - 2  // слева от выделения
            : editorLeft;

          // Проверяем, не выходит ли за нижний край
          const viewportHeight = window.innerHeight;
          const editorHeight = 300; // max-height редактора
          const adjustedTop = editorTop + editorHeight > viewportHeight
            ? viewportHeight - editorHeight - 10
            : editorTop;

          setEditorPosition({
            position: 'fixed',
            left: adjustedLeft,
            top: Math.max(10, adjustedTop),  // минимум 10px от верха
            zIndex: 1000
          });
        }
      }

      setRegionStyles(allStyles);

      if (allStyles.length === 0) {
        setEditorPosition(null);
      }
    });
  }, [startCell, endCell, selections, employeeIds, tableRef]);

  // Отменяем незавершённый RAF при размонтировании компонента
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Обновляем позиции при изменении выделения
  useEffect(() => {
    updateOverlayPositions();
  }, [updateOverlayPositions]);

  // Стабильная ссылка на актуальную версию updateOverlayPositions —
  // позволяет не пересоздавать scroll listener при каждом изменении выделения
  const updateOverlayRef = useRef(updateOverlayPositions);
  useEffect(() => {
    updateOverlayRef.current = updateOverlayPositions;
  }, [updateOverlayPositions]);

  // Сбрасываем контекстное меню при начале нового drag или снятии выделения
  useEffect(() => {
    if (isDragging || (!startCell && selections.length === 0)) {
      setShowContextMenu(false);
    }
  }, [isDragging, startCell, selections]);

  // Подавляем браузерное контекстное меню и показываем своё при правом клике
  useEffect(() => {
    const handleContextMenu = (e) => {
      if (!tableRef?.current?.contains(e.target)) return;
      const { startCell: sc, getAllSelections } = useSelectionStore.getState();
      const allSels = getAllSelections();
      if (allSels.length > 0 || sc) {
        e.preventDefault();
        setShowContextMenu(true);
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [useSelectionStore, tableRef]);

  // Закрываем контекстное меню при клике вне его
  useEffect(() => {
    if (!showContextMenu) return;
    const handleMouseDown = (e) => {
      if (!menuRef.current?.contains(e.target)) {
        setShowContextMenu(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showContextMenu]);

  // Обновляем позиции при скролле — listener регистрируется только при смене tableRef
  useEffect(() => {
    if (!tableRef?.current) return;

    const scrollContainer = tableRef.current.closest('.scrollable_container') || tableRef.current.parentElement;
    if (!scrollContainer) return;

    const handleScroll = () => {
      updateOverlayRef.current();
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [tableRef]);

  // Применить значение ко ВСЕМ выделенным ячейкам (включая множественные регионы)
  const handleSelectValue = useCallback((newValue) => {
    const { setStatus } = useClipboardStore.getState();
    const { pushUndoDelta, batchUpdateDraftCells, employeeIds } = useAdminStore.getState();
    const allSelections = useSelectionStore.getState().getAllSelections();

    if (allSelections.length === 0) return;

    const updates = {};
    let count = 0;

    for (const { startCell, endCell } of allSelections) {
      const startEmpIdx = employeeIds.indexOf(startCell.employeeId);
      const endEmpIdx = employeeIds.indexOf(endCell.employeeId);

      const minEmpIdx = Math.min(startEmpIdx, endEmpIdx);
      const maxEmpIdx = Math.max(startEmpIdx, endEmpIdx);
      const minSlot = Math.min(startCell.slotIndex, endCell.slotIndex);
      const maxSlot = Math.max(startCell.slotIndex, endCell.slotIndex);

      for (let empIdx = minEmpIdx; empIdx <= maxEmpIdx; empIdx++) {
        for (let slot = minSlot; slot <= maxSlot; slot++) {
          const empId = employeeIds[empIdx];
          const date = slotToDate[slot];
          if (empId && date) {
            updates[`${empId}-${date}`] = newValue;
            count++;
          }
        }
      }
    }

    if (count === 0) return;

    // Сохраняем дельту для undo (только старые значения затронутых ячеек)
    pushUndoDelta(updates);
    batchUpdateDraftCells(updates);
    setStatus(`Установлено "${newValue || '-'}" для ${count} ячеек`);
    setHoveredValue(null);
    setShowContextMenu(false);
  }, [slotToDate, useSelectionStore]);

  // Остановка событий мыши
  const stopPropagation = useCallback((e) => {
    e.stopPropagation();
  }, []);

  // Показывать CellEditor только по правому клику при наличии выделения (включая одну ячейку)
  const showEditor = showContextMenu && editorPosition && !isDragging && !hasCopiedData && regionStyles.length > 0;

  // Не рендерим если нет выделения
  if (regionStyles.length === 0) return null;

  return (
    <>
      {/* Overlay для каждого региона выделения */}
      {regionStyles.map((style, idx) => (
        <div key={idx} style={style} />
      ))}

      {/* CellEditor */}
      {showEditor && (
        <div
          ref={menuRef}
          style={editorPosition}
          className={styles.cellEditor}
          onMouseDown={stopPropagation}
          onMouseUp={stopPropagation}
          onMouseOver={stopPropagation}
          onClick={stopPropagation}
          onDoubleClick={stopPropagation}
        >
          {statusOptions.map(option => (
            <div
              key={option.value}
              className={`${styles.cellEditorOption} ${hoveredValue === option.value ? styles.cellEditorOptionSelected : ''}`}
              onMouseEnter={() => setHoveredValue(option.value)}
              onMouseLeave={() => setHoveredValue(null)}
              onClick={() => handleSelectValue(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default SelectionOverlay;
