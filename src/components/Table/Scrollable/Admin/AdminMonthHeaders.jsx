import { useDateAdminStore } from '../../../../store/dateAdminStore';

const AdminMonthHeaders = ({tableId = 'main'}) => {
    const monthGroups = useDateAdminStore(state => state.monthGroups);
    const offsetMonthGroups = useDateAdminStore(state => state.offsetMonthGroups);

    return (
        <tr>
            {tableId === 'main' ? 
                monthGroups.map((group, i) => (
                    <th key={i} colSpan={group.colspan}>
                        {group.month}
                    </th>
                )) : 
                offsetMonthGroups.map((group, i) => (
                    <th key={i} colSpan={group.colspan}>
                        {group.month}
                    </th>
                ))
            }
        </tr>
    )
}

export default AdminMonthHeaders;