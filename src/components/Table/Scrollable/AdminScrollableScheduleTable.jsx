import { useRef } from 'react';
import { useScheduleStore } from '../../../store/scheduleStore';
import { useDateStore } from '../../../store/dateStore';

import AdminEmployeeRow from '../Rows/AdminEmployeeRow';
import MonthHeaders from './MonthHeaders';
import SelectionOverlay from '../SelectionOverlay';

import styles from '../Table.module.css';


const AdminScrollableScheduleTable = () => {
    const tableRef = useRef(null);
    const employeeIds = useScheduleStore(state => state.employeeIds);
    const visibleSlots = useDateStore(state => state.visibleSlots);
    const slotToDate = useDateStore(state => state.slotToDate);
    const slotToDay = useDateStore(s => s.slotToDay);
    const monthGroups = useDateStore(state => state.monthGroups);

    return (
        <div className={styles.scrollable_container} style={{ position: 'relative' }}>
          <table ref={tableRef} className={styles.scrollable_column}>
            <thead>
              <MonthHeaders monthGroups={monthGroups}/>
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
              {/* Каждая строка = сотрудник */}
              {employeeIds.map((empId, empIdx) => (
                <AdminEmployeeRow
                  key={empId}
                  empId={empId}
                  empIdx={empIdx}
                />
              ))}
            </tbody>
          </table>
          <SelectionOverlay tableRef={tableRef} />
        </div>
    )
}

export default AdminScrollableScheduleTable;
