import { forwardRef, useMemo } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { MONTHS } from '../../constants/index';

import AdminEmployeeRow from './AdminEmployeeRow';

import tableStyles from '../Table/Table.module.css';

const AdminScrollableTable = forwardRef(({ dates, onScroll, emptyFromIndex }, ref) => {
  const employeeIds = useScheduleStore(state => state.employeeIds);

  // Вычисляем группировку по месяцам для заголовков
  const monthGroups = useMemo(() => {
    if (!dates || dates.length === 0) return [];

    const groups = [];
    let currentMonth = null;
    let colspan = 0;

    dates.forEach(dateStr => {
      const d = new Date(dateStr);
      const monthIndex = d.getMonth();
      const year = d.getFullYear();
      const monthKey = `${year}-${monthIndex}`;

      if (monthKey !== currentMonth) {
        if (colspan > 0 && currentMonth !== null) {
          const [prevYear, prevMonth] = currentMonth.split('-');
          groups.push({
            month: MONTHS[parseInt(prevMonth)],
            year: parseInt(prevYear),
            colspan
          });
        }
        currentMonth = monthKey;
        colspan = 1;
      } else {
        colspan++;
      }
    });

    // Добавляем последнюю группу
    if (colspan > 0 && currentMonth !== null) {
      const [prevYear, prevMonth] = currentMonth.split('-');
      groups.push({
        month: MONTHS[parseInt(prevMonth)],
        year: parseInt(prevYear),
        colspan
      });
    }

    return groups;
  }, [dates]);

  return (
    <div
      ref={ref}
      className={tableStyles.scrollable_container}
      onScroll={onScroll}
    >
      <table className={tableStyles.scrollable_column}>
        <thead>
          {/* Заголовок с месяцами */}
          <tr>
            {monthGroups.map((group, i) => (
              <th key={i} colSpan={group.colspan}>
                {group.month}
              </th>
            ))}
          </tr>
          {/* Заголовок с числами */}
          <tr>
            {dates.map((date, index) => {
              const day = new Date(date).getDate();
              return (
                <th key={index}>
                  {day}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {employeeIds.map(empId => (
            <AdminEmployeeRow
              key={empId}
              empId={empId}
              dates={dates}
              emptyFromIndex={emptyFromIndex}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});

AdminScrollableTable.displayName = 'AdminScrollableTable';

export default AdminScrollableTable;
