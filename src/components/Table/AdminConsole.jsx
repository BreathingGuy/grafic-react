import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useDateAdminStore } from '../../store/dateAdminStore';
import { useDateUserStore } from '../../store/dateUserStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

import AdminHeader from './AdminHeader';
import AdminYearSelector from './AdminYearSelector';
import AdminStatusBar from './AdminStatusBar';
import FixedEmployeeColumn from './Static/FixedEmployeeColumn';
import AdminScrollableScheduleTable from './Scrollable/AdminScrollableScheduleTable';

import styles from './Table.module.css';

/**
 * AdminConsole - Контейнер для редактирования графика
 *
 * Минимум подписок — только для инициализации.
 * Все UI-данные вынесены в подкомпоненты:
 * - AdminHeader: кнопки управления (hasUnsavedChanges)
 * - AdminStatusBar: статус выделения (startCell, endCell, statusMessage)
 * - AdminScrollableScheduleTable: таблицы (employeeIds, slotToDate, draftSchedule)
 */
function AdminConsole() {
  // Keyboard shortcuts
  useKeyboardShortcuts();

  // Только для инициализации — не вызывают ререндер при изменении данных таблицы
  const initializeDraft = useAdminStore(s => s.initializeDraft);
  const clearDraft = useAdminStore(s => s.clearDraft);
  const initializeYear = useDateAdminStore(s => s.initializeYear);
  const currentYear = useDateAdminStore(s => s.currentYear);
  const userCurrentYear = useDateUserStore(s => s.currentYear);
  const currentDepartmentId = useWorkspaceStore(s => s.currentDepartmentId);
  const clearSelection = useSelectionStore(s => s.clearSelection);

  // Инициализация при монтировании
  useEffect(() => {
    initializeYear(userCurrentYear);

    return () => {
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

  return (
    <div style={{ padding: '20px' }}>
      <AdminHeader />
      <AdminYearSelector />
      <AdminStatusBar />

      <div className={styles.container}>
        <FixedEmployeeColumn />
        <AdminScrollableScheduleTable />
      </div>
    </div>
  );
}

export default AdminConsole;
