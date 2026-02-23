import { memo } from 'react';
import { useDateUserStore } from '../../../../store/dateUserStore';

const DaySlots = memo(() => {
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
});

DaySlots.displayName = 'DaySlots';

export default DaySlots;