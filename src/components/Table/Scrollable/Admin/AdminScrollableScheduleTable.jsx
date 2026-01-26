import { useRef, memo } from 'react';
import { useDateAdminStore } from '../../../../store/dateAdminStore';
import { useMainSelectionStore, useOffsetSelectionStore } from '../../../../store/selection';

import AdminDatingComps from './AdminDatingComps';
import AdminRows from './AdminRows'
import SelectionOverlay from '../../SelectionOverlay';

import styles from '../../Table.module.css';

/**
 * AdminScrollableScheduleTable - Прокручиваемая часть таблицы расписания для админ-режима
 *
 * Содержит две таблицы:
 * - main: основная таблица года (январь-декабрь)
 * - offset: таблица со сдвигом на 3 месяца (апрель-март) для квартального сравнения
 */
const AdminScrollableScheduleTable = memo(() => {
    const mainTableRef = useRef(null);
    const offsetTableRef = useRef(null);

    const slotToDate = useDateAdminStore(state => state.slotToDate);
    const offsetSlotToDate = useDateAdminStore(state => state.offsetSlotToDate);

    return (
        <div className={styles.scrollable_container}>
          {/* Основная таблица (январь-декабрь) */}
          <div style={{ position: 'relative' }}>
            <table ref={mainTableRef} className={styles.scrollable_column}>
              <AdminDatingComps tableId="main" />
              <AdminRows tableId="main" useSelectionStore={useMainSelectionStore} />
            </table>
            <SelectionOverlay
              tableRef={mainTableRef}
              slotToDate={slotToDate}
              useSelectionStore={useMainSelectionStore}
            />
          </div>

          {/* Offset таблица (апрель-март) */}
          <div style={{ position: 'relative', marginTop: '40px' }}>
            <table ref={offsetTableRef} className={styles.scrollable_column}>
              <AdminDatingComps tableId="offset" />
              <AdminRows tableId="offset" useSelectionStore={useOffsetSelectionStore} />
            </table>
            <SelectionOverlay
              tableRef={offsetTableRef}
              slotToDate={offsetSlotToDate}
              useSelectionStore={useOffsetSelectionStore}
            />
          </div>
        </div>
    )
});

AdminScrollableScheduleTable.displayName = 'AdminScrollableScheduleTable';

export default AdminScrollableScheduleTable;
