import { useSchedule } from '../../context/ScheduleContext';
import { getDateRange } from '../../utils/dateHelpers';
import { STATUS_COLORS } from '../../constants/index';
import { useState } from 'react';

export default function ScheduleTable({ period, search }) {
  const { employeesMap, getStatus, loading } = useSchedule();
  const [baseDate] = useState(new Date('2025-11-30')); // фиксируем 30 ноября 2025

  let employees = Object.values(employeesMap);
  
  if (search) {
    const s = search.toLowerCase();
    employees = employees.filter(e => e.name_long.toLowerCase().includes(s));
  }
  
  employees.sort((a, b) => a.name.localeCompare(b.name));

  const { dates, groups } = getDateRange(period, baseDate);

  const shift = (direction) => {
    const amount = period === '3months' ? 3 : period === '1month' ? 1 : 7;
    const newDate = new Date(baseDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? amount : -amount));
    if (period === '7days') newDate.setDate(newDate.getDate() + (direction === 'next' ? amount : -amount));
    // Здесь просто меняем baseDate в состоянии родителя или через контекст, но для простоты пока оставим фиксированную дату
    // В полной версии добавишь setBaseDate
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <>
      <div style={{ marginBottom: '15px' }}>
        <button onClick={() => shift('prev')}>← Назад</button>
        <button onClick={() => shift('next')} style={{ marginLeft: '8px' }}>Вперёд →</button>
      </div>

      <div style={{ display: 'flex' }}>
        <table style={{ borderCollapse: 'collapse', width: '250px' }}>
          <thead>
            <tr><th></th></tr>
            <tr><th style={{ textAlign: 'left', paddingLeft: '15px' }}>Сотрудник</th></tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td title={emp.name_long} style={{ paddingLeft: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {emp.name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {groups.map((g, i) => (
                  <th key={i} colSpan={g.colspan} style={{ border: '1px solid #ccc', padding: '4px' }}>
                    {g.month}
                  </th>
                ))}
              </tr>
              <tr>
                {dates.map(d => (
                  <th key={d} style={{ border: '1px solid #ccc', width: '20px', minWidth: '20px' }}>
                    {new Date(d).getDate()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  {dates.map(date => {
                    const status = getStatus(emp.id, date);
                    const colorClass = STATUS_COLORS[status] || '';
                    const bgColor = 
                      status === 'Д' ? '#d4edda' :
                      status === 'В' ? '#f8d7da' :
                      status === 'У' ? '#fff3cd' :
                      status === 'О' || status === 'ОВ' ? '#d1ecf1' :
                      status === 'Н1' || status === 'Н2' ? '#9c27b0' :
                      status === 'ЭУ' ? '#ff9800' : '';
                    return (
                      <td
                        key={date}
                        style={{
                          border: '1px solid #ccc',
                          textAlign: 'center',
                          width: '20px',
                          minWidth: '20px',
                          backgroundColor: bgColor,
                          color: status === 'Н1' || status === 'Н2' || status === 'ЭУ' ? 'white' : 'black'
                        }}
                      >
                        {status}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}