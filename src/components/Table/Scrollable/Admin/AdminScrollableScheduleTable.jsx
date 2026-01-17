import { useRef } from 'react';
import { useAdminStore } from '../../../../store/adminStore';
import { useDateAdminStore } from '../../../../store/dateAdminStore';

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
const AdminScrollableScheduleTable = () => {
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
              <AdminRows tableId="main"/>
            </table>
            <SelectionOverlay tableRef={mainTableRef} tableId="main" slotToDate={slotToDate} />
          </div>

          {/* Offset таблица (апрель-март) */}
          <div style={{ position: 'relative', marginTop: '40px' }}>
            <table ref={offsetTableRef} className={styles.scrollable_column}>
              <AdminDatingComps tableId="offset" />
              <AdminRows tableId="offset"/>
            </table>
            <SelectionOverlay tableRef={offsetTableRef} tableId="offset" slotToDate={offsetSlotToDate} />
          </div>
        </div>
    )
}

export default AdminScrollableScheduleTable;
