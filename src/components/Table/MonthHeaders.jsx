export default function MonthHeaders({monthGroups}) {
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