import { useRef, memo } from 'react';
import { useDateAdminStore } from '../../../../store/dateAdminStore';
import { useOffsetSelectionStore } from '../../../../store/selection';

import AdminDatingComps from './AdminDatingComps';
import OffsetAdminRows from './OffsetAdminRows';
import SelectionOverlay from '../../SelectionOverlay';

import styles from '../../Table.module.css';

/**
 * OffsetAdminTable - Полностью изолированная offset таблица (апрель-март)
 *
 * Содержит собственные:
 * - ref для таблицы
 * - подписку на offsetSlotToDate
 * - SelectionOverlay
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
        <OffsetAdminRows />
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
