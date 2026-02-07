import { useRef, memo } from 'react';
import { useDateAdminStore } from '../../../../store/dateAdminStore';
import { useOffsetSelectionStore } from '../../../../store/selection';

import AdminDatingComps from './AdminDatingComps';
import AdminRows from './AdminRows';
import SelectionOverlay from '../../SelectionOverlay';

import styles from '../../Table.module.css';

/**
 * OffsetAdminTable - Изолированная offset таблица (апрель-март)
 *
 * Изолирована от MainAdminTable — ре-рендер одной не влияет на другую
 */
const OffsetAdminTable = memo(() => {
  const tableRef = useRef(null);
  const slotToDate = useDateAdminStore(state => state.offsetSlotToDate);

  return (
    <div style={{ position: 'relative', marginTop: '40px' }}>
      <table ref={tableRef} className={styles.scrollable_column}>
        <AdminDatingComps tableId="offset" />
        <AdminRows tableId="offset" useSelectionStore={useOffsetSelectionStore} />
      </table>
      <SelectionOverlay
        tableRef={tableRef}
        slotToDate={slotToDate}
        useSelectionStore={useOffsetSelectionStore}
      />
    </div>
  );
});

OffsetAdminTable.displayName = 'OffsetAdminTable';

export default OffsetAdminTable;
