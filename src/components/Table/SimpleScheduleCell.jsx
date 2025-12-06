import { useScheduleStore } from '../../store/scheduleStore';

export default function SimpleScheduleCell({ employeeId, date }) {
  const key = `${employeeId}-${date}`;
  const status = useScheduleStore(state => state.scheduleMap[key] || '');

  return <td>{status}</td>;
}
