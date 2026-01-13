import { useRef } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { useDateAdminStore } from '../../../store/dateAdminStore';

import AdminEmployeeRow from '../Rows/AdminEmployeeRow';
import MonthHeaders from './MonthHeaders';
import SelectionOverlay from '../SelectionOverlay';

import styles from '../Table.module.css';

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
    const visibleSlots = useDateAdminStore(state => state.visibleSlots);

    // Данные основной таблицы
    const slotToDate = useDateAdminStore(state => state.slotToDate);
    const slotToDay = useDateAdminStore(s => s.slotToDay);

    // Данные offset таблицы
    const offsetSlotToDate = useDateAdminStore(state => state.offsetSlotToDate);
    const offsetSlotToDay = useDateAdminStore(state => state.offsetSlotToDay);

    return (
        <div className={styles.scrollable_container}>
          {/* Основная таблица (январь-декабрь) */}
          <div style={{ position: 'relative' }}>
            <table ref={mainTableRef} className={styles.scrollable_column}>
              <thead>
                <MonthHeaders isAdmin tableId="main" />
                <tr>
                  {visibleSlots.map(slotIndex => {
                    const date = slotToDate[slotIndex];
                    if (!date) {return null;}
                    return (
                      <th key={slotIndex}>
                        {slotToDay[slotIndex]}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {employeeIds.map((empId, empIdx) => (
                  <AdminEmployeeRow
                    key={empId}
                    empId={empId}
                    empIdx={empIdx}
                    tableId="main"
                    slotToDate={slotToDate}
                  />
                ))}
              </tbody>
            </table>
            <SelectionOverlay tableRef={mainTableRef} tableId="main" slotToDate={slotToDate} />
          </div>

          {/* Offset таблица (апрель-март) */}
          <div style={{ position: 'relative', marginTop: '40px' }}>
            <table ref={offsetTableRef} className={styles.scrollable_column}>
              <thead>
                <MonthHeaders isAdmin tableId="offset" />
                <tr>
                  {visibleSlots.map(slotIndex => {
                    const date = offsetSlotToDate[slotIndex];
                    if (!date) {return null;}
                    return (
                      <th key={slotIndex}>
                        {offsetSlotToDay[slotIndex]}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {employeeIds.map((empId, empIdx) => (
                  <AdminEmployeeRow
                    key={empId}
                    empId={empId}
                    empIdx={empIdx}
                    tableId="offset"
                    slotToDate={offsetSlotToDate}
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
