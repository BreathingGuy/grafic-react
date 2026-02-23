import {useDateUserStore} from '../../store/dateUserStore'

export function PeriodSelector() {
    const setPeriod = useDateUserStore(state => state.setPeriod);
    const period = useDateUserStore(state => state.period);
    const periods = useDateUserStore(state => state.periods);

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
