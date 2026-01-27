import { useRef, memo } from 'react';
import { useDateAdminStore } from '../../../../store/dateAdminStore';
import { useMainSelectionStore } from '../../../../store/selection';

import AdminDatingComps from './AdminDatingComps';
import MainAdminRows from './MainAdminRows';
import SelectionOverlay from '../../SelectionOverlay';

import styles from '../../Table.module.css';

/**
 * MainAdminTable - Полностью изолированная main таблица (январь-декабрь)
 *
 * Содержит собственные:
 * - ref для таблицы
 * - подписку на slotToDate
 * - SelectionOverlay
 *
 * Изолирована от OffsetAdminTable — ре-рендер одной не влияет на другую
 */
const MainAdminTable = memo(() => {
  const tableRef = useRef(null);
  const slotToDate = useDateAdminStore(state => state.slotToDate);

  return (
    <div style={{ position: 'relative' }}>
      <table ref={tableRef} className={styles.scrollable_column}>
        <AdminDatingComps tableId="main" />
        <MainAdminRows />
      </table>
      <SelectionOverlay
        tableRef={tableRef}
        slotToDate={slotToDate}
        useSelectionStore={useMainSelectionStore}
      />
    </div>
  );
});

MainAdminTable.displayName = 'MainAdminTable';

export default MainAdminTable;
