import { ScheduleProvider } from './context/ScheduleContext';
import ScheduleTable from './components/Table/ScheduleTable';
import { useState } from 'react';

function Main() {
  const [period, setPeriod] = useState('1month');
  const [search, setSearch] = useState('');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Поиск по имени..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '250px', padding: '6px', marginRight: '15px' }}
        />
        <select value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="3months">3 месяца</option>
          <option value="1month">1 месяц</option>
          <option value="7days">7 дней</option>
        </select>
      </div>
      <ScheduleTable period={period} search={search} />
    </div>
  );
}

export default function App() {
  return (
    <ScheduleProvider>
      <Main />
    </ScheduleProvider>
  );
}