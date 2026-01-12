import { useScheduleStore } from '../../../store/scheduleStore';
import useDateUserStore from '../../../store/dateUserStore';

import EmployeeRow from '../Rows/EmployeeRow';
import MonthHeaders from './MonthHeaders';
import DaySlots from './DaySlots';

import styles from '../Table.module.css';

const ScrollableUserTable = () => {
    const employeeIds = useScheduleStore(state => state.employeeIds);
    const visibleSlots = useDateUserStore(state => state.visibleSlots);
    const slotToDate = useDateUserStore(state => state.slotToDate);
    const slotToDay = useDateUserStore(s => s.slotToDay);
    const monthGroups = useDateUserStore(state => state.monthGroups);

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
                <EmployeeRow
                  key={empId}
                  empId={empId}
                />
              ))}
            </tbody>
          </table>
        </div>
    )
}

export default ScrollableUserTable;