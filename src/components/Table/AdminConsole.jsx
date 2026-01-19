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

  // Используем editingDepartmentId и editingYear из adminStore
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);
  const editingYear = useAdminStore(s => s.editingYear);
  const currentDepartmentId = useWorkspaceStore(s => s.currentDepartmentId);
  const userCurrentYear = useDateUserStore(s => s.currentYear);

  // Инициализация при первом входе в админ режим
  useEffect(() => {
    // Если editingDepartmentId не установлен, но есть currentDepartmentId
    // значит мы только что вошли в админ режим
    if (currentDepartmentId && !editingDepartmentId) {
      console.log(`🔄 Первый вход в админ режим для отдела ${currentDepartmentId}`);
      const adminStore = useAdminStore.getState();

      // Устанавливаем контекст редактирования
      adminStore.setEditingContext(currentDepartmentId, userCurrentYear);
    }
  }, [currentDepartmentId, editingDepartmentId, userCurrentYear]);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      // При размонтировании очищаем только данные, но НЕ выходим из админ режима
      // clearDraft() вызывается только при явном выходе из админ режима (кнопка "Выйти")
      useSelectionStore.getState().clearSelection();
    };
  }, []);

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
