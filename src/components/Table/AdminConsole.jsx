import { memo } from 'react';

import AdminHeader from './AdminStaticComponents/AdminHeader';
import AdminYearSelector from './AdminStaticComponents/AdminYearSelector';
import AdminStatusBar from './AdminStaticComponents/AdminStatusBar';
import AdminFixedEmployeeColumn from './Static/AdminFixedEmployeeColumn';
import AdminScrollableScheduleTable from './Scrollable/Admin/AdminScrollableScheduleTable';

import styles from './Table.module.css';

/**
 * AdminConsole - Контейнер для редактирования графика (только UI)
 *
 * Обернут в memo для предотвращения лишних ре-рендеров.
 * Вся логика инициализации и подписки вынесены в AdminInitializer.
 *
 * Содержит:
 * - AdminHeader: кнопки управления (hasUnsavedChanges)
 * - AdminYearSelector: выбор года
 * - AdminStatusBar: статус выделения (startCell, endCell, statusMessage)
 * - AdminFixedEmployeeColumn: фиксированная колонка с именами
 * - AdminScrollableScheduleTable: таблицы (employeeIds, slotToDate, draftSchedule)
 */
const AdminConsole = memo(() => {
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
});

AdminConsole.displayName = 'AdminConsole';

export default AdminConsole;
