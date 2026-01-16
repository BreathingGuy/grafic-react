import { useRef } from 'react';
import { useAdminStore } from '../../../../store/adminStore';
import { useDateAdminStore } from '../../../../store/dateAdminStore';

import AdminDatingComps from './AdminDatingComps';
import AdminEmployeeRow from '../../Rows/AdminEmployeeRow';
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

    const employeeIds = useAdminStore(state => state.employeeIds);

    // Данные основной таблицы
    const slotToDate = useDateAdminStore(state => state.slotToDate);

    // Данные offset таблицы
    const offsetSlotToDate = useDateAdminStore(state => state.offsetSlotToDate);

    return (
        <div className={styles.scrollable_container}>
          {/* Основная таблица (январь-декабрь) */}
          <div style={{ position: 'relative' }}>
            <table ref={mainTableRef} className={styles.scrollable_column}>
              <AdminDatingComps tableId="main" />
              <tbody>
                {employeeIds.map((empId, empIdx) => (
                  <AdminEmployeeRow
                    key={empId}
                    empId={empId}
                    empIdx={empIdx}
                    tableId="main"
                  />
                ))}
              </tbody>
            </table>
            <SelectionOverlay tableRef={mainTableRef} tableId="main" slotToDate={slotToDate} />
          </div>

          {/* Offset таблица (апрель-март) */}
          <div style={{ position: 'relative', marginTop: '40px' }}>
            <table ref={offsetTableRef} className={styles.scrollable_column}>
              <AdminDatingComps tableId="offset" />
              <tbody>
                {employeeIds.map((empId, empIdx) => (
                  <AdminEmployeeRow
                    key={empId}
                    empId={empId}
                    empIdx={empIdx}
                    tableId="offset"
                  />
                ))}
              </tbody>
            </table>
            <SelectionOverlay tableRef={offsetTableRef} tableId="offset" slotToDate={offsetSlotToDate} />
          </div>
        </div>
    )
}

export default AdminScrollableScheduleTable;
