import { useDateUserStore } from '../../../../store/dateUserStore';


const DaySlots = () => {
    const visibleSlots = useDateUserStore(state => state.visibleSlots);
    const slotToDate = useDateUserStore(state => state.slotToDate);

    return (
        <tr>
            {visibleSlots.map(slotIndex => {
                const date = slotToDate[slotIndex];
                if (!date) {return null;}
                return (
                <th key={slotIndex}>
                    {date ? new Date(date).getDate() : ''}
                </th>
                );
            })}
        </tr>
    )
}

export default DaySlots;