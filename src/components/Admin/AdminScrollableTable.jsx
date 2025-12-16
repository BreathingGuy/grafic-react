import { useScheduleStore } from '../../store/scheduleStore';
import AdminEmployeeRow from './AdminEmployeeRow';
import { MONTHS } from '../../constants/index';

import styles from './AdminScheduleTable.module.css';

export default function AdminScrollableTable({ dates, scrollRef, onScroll, quarter }) {
  const employeeIds = useScheduleStore(state => state.employeeIds);

  // Группировка дат по месяцам для заголовков
  const calculateMonthGroups = (dates) => {
    if (dates.length === 0) return [];

    const monthGroups = [];
    let currentMonth = null;
    let colspan = 0;

    dates.forEach(dateStr => {
      const d = new Date(dateStr);
      const monthIndex = d.getMonth();

      if (monthIndex !== currentMonth) {
        if (colspan > 0) {
          monthGroups.push({ month: MONTHS[currentMonth], colspan });
        }
        currentMonth = monthIndex;
        colspan = 1;
      } else {
        colspan++;
      }
    });

    if (colspan > 0) {
      monthGroups.push({ month: MONTHS[currentMonth], colspan });
    }

    return monthGroups;
  };

  const monthGroups = calculateMonthGroups(dates);

  return (
    <div
      className={styles.scrollableContainer}
      ref={scrollRef}
      onScroll={onScroll}
    >
      <table className={styles.scrollableTable}>
        <thead>
          {/* Заголовки месяцев */}
          <tr>
            {monthGroups.map((group, index) => (
              <th key={index} colSpan={group.colspan} className={styles.monthHeader}>
                {group.month}
              </th>
            ))}
          </tr>

          {/* Заголовки дней */}
          <tr>
            {dates.map((dateStr, index) => {
              const date = new Date(dateStr);
              const day = date.getDate();
              return (
                <th key={index} className={styles.dayHeader}>
                  {day}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {employeeIds.map((empId, rowIndex) => (
            <AdminEmployeeRow
              key={`${empId}-q${quarter}`}
              empId={empId}
              dates={dates}
              rowIndex={rowIndex}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
