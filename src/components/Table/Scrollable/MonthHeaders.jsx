import { useDateStore } from '../../../store/dateStore';

export default function MonthHeaders() {
    const monthGroups = useDateStore(state => state.monthGroups);
    return (
        <tr>
            {monthGroups.map((group, i) => (
                <th key={i} colSpan={group.colspan}>
                    {group.month}
                </th>
            ))}
        </tr>
    )
}