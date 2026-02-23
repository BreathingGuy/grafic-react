import { memo } from 'react';
import { useDateUserStore } from '../../../../store/dateUserStore';

const MonthHeaders = memo(() => {
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
});

MonthHeaders.displayName = 'MonthHeaders';

export default MonthHeaders;