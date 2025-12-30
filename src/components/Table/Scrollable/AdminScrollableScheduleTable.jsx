import { useScheduleStore } from '../../../store/scheduleStore';
import { useDateStore } from '../../../store/dateStore';

import AdminEmployeeRow from '../Rows/AdminEmployeeRow';
import MonthHeaders from './MonthHeaders';

import styles from '../Table.module.css';


const AdminScrollableScheduleTable = () => {
    const employeeIds = useScheduleStore(state => state.employeeIds);
    const visibleSlots = useDateStore(state => state.visibleSlots);
    const slotToDate = useDateStore(state => state.slotToDate);
    const slotToDay = useDateStore(s => s.slotToDay);
    const monthGroups = useDateStore(state => state.monthGroups);

    return (
        <div className={styles.scrollable_container}>
          <table className={styles.scrollable_column}>
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
              {/* 🎯 Передаем ТОЛЬКО employee - без dates! */}
              {employeeIds.map(empId => (
                <AdminEmployeeRow
                  key={empId}
                  empId={empId}
                />
              ))}
            </tbody>
          </table>
        </div>
    )
}

export default AdminScrollableScheduleTable;