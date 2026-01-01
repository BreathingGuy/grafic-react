import { useScheduleStore } from '../../../store/scheduleStore';
import { useDateStore } from '../../../store/dateStore';

import EmployeeRow from '../Rows/EmployeeRow';
import MonthHeaders from './MonthHeaders';

import styles from '../Table.module.css';


const ScrollableScheduleTable = () => {
    const employeeIds = useScheduleStore(state => state.employeeIds);
    const visibleSlots = useDateStore(state => state.visibleSlots);
    const slotToDate = useDateStore(state => state.slotToDate);

    return (
        <div className={styles.scrollable_container}>
          <table className={styles.scrollable_column}>
            <thead>
              <MonthHeaders/>
              <tr>
                {visibleSlots.map(slotIndex => {
                  const date = slotToDate[slotIndex];
                  if (!date) {return null;}
                  return (
                    <th key={slotIndex}>
                      {date ? new Date(date).getDate() : ''}
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

export default ScrollableScheduleTable;