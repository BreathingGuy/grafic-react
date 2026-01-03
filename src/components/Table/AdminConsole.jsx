import { useEffect } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useAdminStore } from '../../store/adminStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useDateStore } from '../../store/dateStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

import FixedEmployeeColumn from './Static/FixedEmployeeColumn';
import AdminScrollableScheduleTable from './Scrollable/AdminScrollableScheduleTable';

import styles from './Table.module.css';

/**
 * AdminConsole - Таблица для редактирования графика
 *
 * Функционал:
 * - Drag-выделение ячеек (через SelectionOverlay)
 * - Ctrl+C/V/Z для копирования/вставки/отмены
 * - Редактирование по двойному клику
 * - Сохранение/публикация изменений
 */
function AdminConsole() {
  // Из scheduleStore только читаем production данные
  const employeeIds = useScheduleStore(s => s.employeeIds);

  // Из adminStore — всё что касается редактирования
  const initializeDraft = useAdminStore(s => s.initializeDraft);
  const publishDraft = useAdminStore(s => s.publishDraft);
  const discardDraft = useAdminStore(s => s.discardDraft);
  const clearDraft = useAdminStore(s => s.clearDraft);
  const hasUnsavedChanges = useAdminStore(s => s.hasUnsavedChanges);

  // Текущий год для инициализации
  const currentYear = useDateStore(s => s.currentYear);
  const setAdminMode = useDateStore(s => s.setAdminMode);

  const statusMessage = useSelectionStore(s => s.statusMessage);
  const startCell = useSelectionStore(s => s.startCell);
  const endCell = useSelectionStore(s => s.endCell);
  const clearSelection = useSelectionStore(s => s.clearSelection);

  // Вычисляем количество выбранных ячеек
  const selectedCount = startCell && endCell && employeeIds.length > 0
    ? useSelectionStore.getState().getSelectedCount(employeeIds)
    : 0;

  // Keyboard shortcuts
  useKeyboardShortcuts();

  // Инициализация при монтировании
  useEffect(() => {
    // Включаем режим админа (без ограничений навигации)
    setAdminMode(true);
    // Инициализируем draft для текущего года
    initializeDraft(currentYear);

    return () => {
      // При выходе — выключаем режим админа и очищаем
      setAdminMode(false);
      clearDraft();
      clearSelection();
    };
  }, [currentYear, initializeDraft, setAdminMode, clearDraft, clearSelection]);

  // Handlers
  const handlePublish = async () => {
    if (window.confirm('Опубликовать изменения?')) {
      const count = await publishDraft();
      alert(`Опубликовано ${count} изменений`);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Отменить все изменения?')) {
      discardDraft();
      clearSelection();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Редактирование графика</h2>
        <div>
          <button onClick={handleDiscard} disabled={!hasUnsavedChanges}>
            Отменить
          </button>
          <button
            onClick={handlePublish}
            disabled={!hasUnsavedChanges}
            style={{ backgroundColor: hasUnsavedChanges ? '#4caf50' : undefined, color: hasUnsavedChanges ? 'white' : undefined }}
          >
            Опубликовать
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        marginBottom: '12px',
        padding: '8px 12px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        fontSize: '14px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>
          {statusMessage || (selectedCount > 0 ? `Выбрано: ${selectedCount} ячеек` : 'Выделите ячейки для редактирования')}
        </span>
        <span style={{ color: '#666' }}>
          Ctrl+C копировать | Ctrl+V вставить | Ctrl+Z отменить | Esc снять выделение
        </span>
      </div>

      {/* Table */}
      <div className={styles.container}>
        {/* Левая колонка - имена */}
        <FixedEmployeeColumn />

        {/* Правая колонка - график */}
        <AdminScrollableScheduleTable />
      </div>
    </div>
  );
}


export default AdminConsole;
