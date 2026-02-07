import { memo } from 'react';

import MainAdminTable from './MainAdminTable';
import OffsetAdminTable from './OffsetAdminTable';

import styles from '../../Table.module.css';

/**
 * AdminScrollableScheduleTable - Контейнер для admin таблиц
 *
 * ВАЖНО: Этот компонент НЕ имеет подписок на store.
 * Это гарантирует, что он никогда не ре-рендерится,
 * и изменения в одной таблице не влияют на другую.
 *
 * MainAdminTable и OffsetAdminTable полностью изолированы друг от друга.
 */
const AdminScrollableScheduleTable = memo(() => {
  return (
    <div className={styles.scrollable_container}>
      <MainAdminTable />
      <OffsetAdminTable />
    </div>
  );
});

AdminScrollableScheduleTable.displayName = 'AdminScrollableScheduleTable';

export default AdminScrollableScheduleTable;
