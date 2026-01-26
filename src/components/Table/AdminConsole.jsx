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
 * Чистый рендер — вся логика инициализации вынесена в AdminInitializer,
 * чтобы useEffect'ы не вызывали ре-рендер дочерних компонентов.
 */
function AdminConsole() {
  // Keyboard shortcuts
  useKeyboardShortcuts();

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
