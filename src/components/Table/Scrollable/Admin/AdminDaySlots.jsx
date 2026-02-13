import { useMemo } from 'react';
import { useAdminStore } from '../../../../store/adminStore';
import { useDateAdminStore } from '../../../../store/dateAdminStore';

const AdminDaySlots = ({tableId = 'main'}) => {
    const visibleSlots = useDateAdminStore(state => state.visibleSlots);
    const slotToDate = useDateAdminStore(state =>
        tableId === 'offset' ? state.offsetSlotToDate : state.slotToDate
    );
    const monthGroups = useDateAdminStore(state =>
        tableId === 'offset' ? state.offsetMonthGroups : state.monthGroups
    );
    const showQuarterSummary = useAdminStore(state => state.showQuarterSummary);

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
                        <th key={`${slotIndex}-n`} style={subHeaderStyle}>Н</th>,
                        <th key={`${slotIndex}-f`} style={subHeaderStyle}>Ф</th>,
                        <th key={`${slotIndex}-d`} style={subHeaderStyle}>Δ</th>
                    ];
                }

                return [th];
            })}
        </tr>
    );
};

const subHeaderStyle = {
    fontSize: '10px',
    fontWeight: 600,
    backgroundColor: '#e8e8e8',
    borderLeft: '1px solid #000',
    borderRight: '1px solid #000',
    textAlign: 'center',
    padding: '0 1px',
    minWidth: '28px'
};

export default AdminDaySlots;
