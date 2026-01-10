import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useDateAdminStore } from '../../store/dateAdminStore';
import { useDateUserStore } from '../../store/dateUserStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
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
  // Из adminStore — всё что касается редактирования
  const initializeDraft = useAdminStore(s => s.initializeDraft);
  const employeeIds = useAdminStore(s => s.employeeIds);
  const publishDraft = useAdminStore(s => s.publishDraft);
  const discardDraft = useAdminStore(s => s.discardDraft);
  const clearDraft = useAdminStore(s => s.clearDraft);
  const hasUnsavedChanges = useAdminStore(s => s.hasUnsavedChanges);

  // Из dateAdminStore — слоты для года
  const initializeYear = useDateAdminStore(s => s.initializeYear);
  const currentYear = useDateAdminStore(s => s.currentYear);

  // Получаем год из user store при первом открытии
  const userCurrentYear = useDateUserStore(s => s.currentYear);

  const currentDepartmentId = useWorkspaceStore(s => s.currentDepartmentId);

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
    // Инициализируем слоты для года (берём год из user store)
    initializeYear(userCurrentYear);

    return () => {
      // При выходе — очищаем
      clearDraft();
      clearSelection();
    };
  }, [initializeYear, userCurrentYear, clearDraft, clearSelection]);

  // Инициализация draft при смене отдела/года
  useEffect(() => {
    if (currentDepartmentId && currentYear) {
      initializeDraft(currentDepartmentId, currentYear);
    }
  }, [currentDepartmentId, currentYear, initializeDraft]);

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