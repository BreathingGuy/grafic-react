import { useDateStore } from '../../../store/dateStore';


const DaySlots = () => {
    const visibleSlots = useDateStore(state => state.visibleSlots);
    const slotToDate = useDateStore(state => state.slotToDate);

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