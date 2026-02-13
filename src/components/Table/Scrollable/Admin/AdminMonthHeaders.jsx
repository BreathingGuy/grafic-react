import { useAdminStore } from '../../../../store/adminStore';
import { useDateAdminStore } from '../../../../store/dateAdminStore';

const AdminMonthHeaders = ({tableId = 'main'}) => {
    const monthGroups = useDateAdminStore(state =>
        tableId === 'offset' ? state.offsetMonthGroups : state.monthGroups
    );
    const showQuarterSummary = useAdminStore(state => state.showQuarterSummary);

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
                        <th key={`q${q}-summary`} colSpan={3} style={summaryHeaderStyle}>
                            Q{q}
                        </th>
                    ];
                }

                return [th];
            })}
        </tr>
    );
};

const summaryHeaderStyle = {
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: '#e8e8e8',
    borderLeft: '2px solid #000',
    borderRight: '2px solid #000',
    textAlign: 'center',
    padding: '2px 4px'
};

export default AdminMonthHeaders;
