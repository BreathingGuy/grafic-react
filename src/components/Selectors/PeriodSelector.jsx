import {useDateStore} from '../../store/dateStore'

export function PeriodSelector() {
    const setPeriod = useDateStore(state => state.setPeriod);
    const period = useDateStore(state => state.period);
    const periods = useDateStore(state => state.periods);

  return (
    <select 
      value={period || ''} 
      onChange={(e) => setPeriod(e.target.value)}
    >
      {periods.map(period => (
        <option key={period} value={period}>{period}</option>
      ))}
    </select>
  );
}
