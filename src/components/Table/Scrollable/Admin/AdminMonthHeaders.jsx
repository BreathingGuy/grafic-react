import { memo } from 'react';
import { useHoursStore } from '../../../../store/admin';
import { useDateAdminStore } from '../../../../store/dateAdminStore';
import s from '../../QuarterSummary.module.css';

const AdminMonthHeaders = memo(({tableId = 'main'}) => {
    const monthGroups = useDateAdminStore(state =>
        tableId === 'offset' ? state.offsetMonthGroups : state.monthGroups
    );
    const showQuarterSummary = useHoursStore(state => state.showQuarterSummary);

    return (
        <tr>
            {monthGroups.flatMap((group, i) => {
                const th = (
                    <th key={i} colSpan={group.colspan}>
                        {group.month}
                    </th>
                );

                // После каждого 3-го месяца (конец квартала) вставляем заголовок итогов
                if (showQuarterSummary && (i + 1) % 3 === 0) {
                    const q = Math.floor(i / 3) + 1;
                    return [
                        th,
                        <th key={`q${q}-summary`} colSpan={3} className={s.summaryHeader}>
                            Q{q}
                        </th>
                    ];
                }

                return [th];
            })}
        </tr>
    );
});

AdminMonthHeaders.displayName = 'AdminMonthHeaders';

export default AdminMonthHeaders;
