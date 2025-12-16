import { forwardRef, useMemo, memo } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useDateStore } from '../../store/dateStore';
import { MONTHS } from '../../constants/index';

import AdminEmployeeRow from './AdminEmployeeRow';

import tableStyles from '../Table/Table.module.css';

const AdminScrollableTable = memo(forwardRef(({ dates, onScroll, emptyFromIndex }, ref) => {
  const employeeIds = useScheduleStore(state => state.employeeIds);
  const dateDays = useDateStore(state => state.dateDays);

  // Вычисляем группировку по месяцам для заголовков
  const monthGroups = useMemo(() => {
    if (!dates || dates.length === 0) return [];

    const groups = [];
    let currentMonth = null;
    let colspan = 0;

    dates.forEach(dateStr => {
      // Парсим дату без создания объекта Date
      const [year, month] = dateStr.split('-');
      const monthIndex = parseInt(month) - 1;
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
          <tr>
            {monthGroups.map((group, i) => (
              <th key={i} colSpan={group.colspan}>
                {group.month}
              </th>
            ))}
          </tr>
          <tr>
            {dates.map((date, index) => (
              <th key={index}>
                {dateDays[date] || ''}
              </th>
            ))}
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
}), (prevProps, nextProps) => {
  // Сравниваем по первой и последней дате, а не по ссылке
  const prevDates = prevProps.dates;
  const nextDates = nextProps.dates;

  if (prevDates.length !== nextDates.length) return false;
  if (prevDates.length === 0) return true;

  return prevDates[0] === nextDates[0] &&
         prevDates[prevDates.length - 1] === nextDates[nextDates.length - 1] &&
         prevProps.emptyFromIndex === nextProps.emptyFromIndex;
});

AdminScrollableTable.displayName = 'AdminScrollableTable';

export default AdminScrollableTable;
