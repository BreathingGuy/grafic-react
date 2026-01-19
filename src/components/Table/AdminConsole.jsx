import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useDateAdminStore } from '../../store/dateAdminStore';
import { useDateUserStore } from '../../store/dateUserStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

import AdminHeader from './AdminStaticComponents/AdminHeader';
import AdminYearSelector from './AdminStaticComponents/AdminYearSelector';
import AdminStatusBar from './AdminStaticComponents/AdminStatusBar';
import AdminFixedEmployeeColumn from './Static/AdminFixedEmployeeColumn';
import AdminScrollableScheduleTable from './Scrollable/Admin/AdminScrollableScheduleTable';

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

  // Только для инициализации
  const currentYear = useDateAdminStore(s => s.currentYear);
  const userCurrentYear = useDateUserStore(s => s.currentYear);
  const currentDepartmentId = useWorkspaceStore(s => s.currentDepartmentId);

  useEffect(() => {
    useDateAdminStore.getState().initializeYear(userCurrentYear);

    return () => {
      useAdminStore.getState().clearDraft();
      useSelectionStore.getState().clearSelection();
    };
  }, [userCurrentYear]);

  // Инициализация draft при смене отдела/года
  useEffect(() => {
    if (currentDepartmentId && currentYear) {
      console.log(`🔄 AdminConsole: инициализация draft для ${currentDepartmentId}/${currentYear}`);
      useAdminStore.getState().initializeDraft(currentDepartmentId, currentYear);
    }
  }, [currentDepartmentId, currentYear]);

  return (
    <div style={{ padding: '20px' }}>
      <AdminHeader />
      <AdminYearSelector />
      <AdminStatusBar />

      <div className={styles.container}>
        <AdminFixedEmployeeColumn />
        <AdminScrollableScheduleTable />
      </div>
    </div>
  );
}

export default AdminConsole;
