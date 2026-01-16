import { useDateStore } from '../../../../store/dateStore';

const MonthHeaders = () => {
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

export default MonthHeaders;