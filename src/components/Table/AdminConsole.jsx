import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { useClipboardStore } from '../../store/selection';
import { useDateAdminStore } from '../../store/dateAdminStore';
import { useDateUserStore } from '../../store/dateUserStore';
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
 * @param {string} currentDepartmentId - ID отдела (передаётся из AdminView)
 *
 * Минимум подписок — только для инициализации.
 */
function AdminConsole({ currentDepartmentId }) {
  // Keyboard shortcuts
  useKeyboardShortcuts();

  // Только для инициализации
  const currentYear = useDateAdminStore(s => s.currentYear);
  const userCurrentYear = useDateUserStore(s => s.currentYear);

  useEffect(() => {
    useDateAdminStore.getState().initializeYear(userCurrentYear);

    return () => {
      useAdminStore.getState().clearDraft();
      useClipboardStore.getState().clearAllSelections();
    };
  }, [userCurrentYear]);

  // Инициализация draft при смене отдела/года
  useEffect(() => {
    if (currentDepartmentId && currentYear) {
      console.log(`🔄 AdminConsole: инициализация draft для ${currentDepartmentId}/${currentYear}`);
      // Очищаем выделения при смене отдела/года, чтобы избежать
      // ссылок на старые employeeId в SelectionOverlay
      useClipboardStore.getState().clearAllSelections();
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
