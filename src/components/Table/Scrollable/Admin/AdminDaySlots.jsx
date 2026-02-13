import { useDateAdminStore } from '../../../../store/dateAdminStore';


const AdminDaySlots = ({tableId = 'main'}) => {
    const visibleSlots = useDateAdminStore(state => state.visibleSlots);
    const slotToDate = useDateAdminStore(state => state.slotToDate);
    const offsetSlotToDate = useDateAdminStore(state => state.offsetSlotToDate);

    return (
        <tr>
            { tableId === 'main' ? 
                visibleSlots.map(slotIndex => {
                    const date = slotToDate[slotIndex];
                    if (!date) {return null;}
                    return (
                    <th key={slotIndex}>
                        {date ? new Date(date).getDate() : ''}
                    </th>
                    );
                }) : 
                visibleSlots.map(slotIndex => {
                    const date = offsetSlotToDate[slotIndex];
                    if (!date) {return null;}
                    return (
                    <th key={slotIndex}>
                        {date ? new Date(date).getDate() : ''}
                    </th>
                    );
                })
            }
        </tr>
    )
}

export default AdminDaySlots;