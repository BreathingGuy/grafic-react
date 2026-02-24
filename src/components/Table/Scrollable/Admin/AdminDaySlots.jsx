import { memo, useMemo } from 'react';
import { useHoursStore } from '../../../../store/admin';
import { useDateAdminStore } from '../../../../store/dateAdminStore';
import s from '../../QuarterSummary.module.css';

const AdminDaySlots = memo(({tableId = 'main'}) => {
    const visibleSlots = useDateAdminStore(state => state.visibleSlots);
    const slotToDate = useDateAdminStore(state =>
        tableId === 'offset' ? state.offsetSlotToDate : state.slotToDate
    );
    const monthGroups = useDateAdminStore(state =>
        tableId === 'offset' ? state.offsetMonthGroups : state.monthGroups
    );
    const showQuarterSummary = useHoursStore(state => state.showQuarterSummary);

    // Вычислить слоты-границы кварталов
    const quarterEndSlots = useMemo(() => {
        if (!showQuarterSummary) return null;
        const ends = new Set();
        let slotOffset = 0;
        for (let i = 0; i < monthGroups.length; i++) {
            slotOffset += monthGroups[i].colspan;
            if ((i + 1) % 3 === 0) {
                ends.add(slotOffset - 1);
            }
        }
        return ends;
    }, [monthGroups, showQuarterSummary]);

    return (
        <tr>
            {visibleSlots.flatMap(slotIndex => {
                const date = slotToDate[slotIndex];
                if (!date) return [];

                const th = (
                    <th key={slotIndex}>
                        {new Date(date).getDate()}
                    </th>
                );

                if (quarterEndSlots && quarterEndSlots.has(slotIndex)) {
                    return [
                        th,
                        <th key={`${slotIndex}-n`} className={s.subHeader}>Н</th>,
                        <th key={`${slotIndex}-f`} className={s.subHeader}>Ф</th>,
                        <th key={`${slotIndex}-d`} className={s.subHeader}>Δ</th>
                    ];
                }

                return [th];
            })}
        </tr>
    );
});

AdminDaySlots.displayName = 'AdminDaySlots';

export default AdminDaySlots;
