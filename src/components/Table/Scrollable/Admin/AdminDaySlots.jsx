import { Fragment } from 'react';
import { useDateAdminStore } from '../../../../store/dateAdminStore';
import { useAdminStore } from '../../../../store/adminStore';

const quarterSubHeaderStyle = {
  backgroundColor: '#e8f0fe',
  fontSize: '10px',
  fontWeight: 500,
  padding: '2px'
};

const AdminDaySlots = ({ tableId = 'main' }) => {
  const visibleSlots = useDateAdminStore(state => state.visibleSlots);
  const slotToDate = useDateAdminStore(state => state.slotToDate);
  const offsetSlotToDate = useDateAdminStore(state => state.offsetSlotToDate);
  const monthGroups = useDateAdminStore(state => state.monthGroups);
  const offsetMonthGroups = useDateAdminStore(state => state.offsetMonthGroups);
  const showQuarterSummary = useAdminStore(state => state.showQuarterSummary);

  const dateMap = tableId === 'main' ? slotToDate : offsetSlotToDate;
  const groups = tableId === 'main' ? monthGroups : offsetMonthGroups;

  // Предвычислить slot-индексы, где заканчиваются кварталы
  const quarterEndSlots = new Set();
  if (showQuarterSummary) {
    let slotIdx = -1;
    for (let i = 0; i < groups.length; i++) {
      slotIdx += groups[i].colspan;
      if ((i + 1) % 3 === 0) {
        quarterEndSlots.add(slotIdx);
      }
    }
  }

  return (
    <tr>
      {visibleSlots.map(slotIndex => {
        const date = dateMap[slotIndex];
        if (!date) return null;
        return (
          <Fragment key={slotIndex}>
            <th>{new Date(date).getDate()}</th>
            {quarterEndSlots.has(slotIndex) && (
              <>
                <th style={quarterSubHeaderStyle}>Н</th>
                <th style={quarterSubHeaderStyle}>Ф</th>
                <th style={quarterSubHeaderStyle}>Δ</th>
              </>
            )}
          </Fragment>
        );
      })}
    </tr>
  );
};

export default AdminDaySlots;
