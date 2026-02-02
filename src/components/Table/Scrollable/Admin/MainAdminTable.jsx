import { useRef, memo } from 'react';
import { useDateAdminStore } from '../../../../store/dateAdminStore';
import { useMainSelectionStore } from '../../../../store/selection';

import AdminDatingComps from './AdminDatingComps';
import AdminRows from './AdminRows';
import SelectionOverlay from '../../SelectionOverlay';

import styles from '../../Table.module.css';

/**
 * MainAdminTable - Изолированная main таблица (январь-декабрь)
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
        <AdminRows tableId="main" useSelectionStore={useMainSelectionStore} />
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
