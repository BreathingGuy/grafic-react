import { useDateUserStore } from '../../../../store/dateUserStore';

const MonthHeaders = () => {
    const monthGroups = useDateUserStore(state => state.monthGroups);

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