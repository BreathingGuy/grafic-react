import { Fragment } from 'react';
import { useDateAdminStore } from '../../../../store/dateAdminStore';
import { useAdminStore } from '../../../../store/adminStore';

const quarterHeaderStyle = {
  backgroundColor: '#e8f0fe',
  fontSize: '11px',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  padding: '4px 2px'
};

const AdminMonthHeaders = ({ tableId = 'main' }) => {
  const monthGroups = useDateAdminStore(state => state.monthGroups);
  const offsetMonthGroups = useDateAdminStore(state => state.offsetMonthGroups);
  const showQuarterSummary = useAdminStore(state => state.showQuarterSummary);

  const groups = tableId === 'main' ? monthGroups : offsetMonthGroups;

  return (
    <tr>
      {groups.map((group, i) => {
        const isQuarterEnd = (i + 1) % 3 === 0;

        return (
          <Fragment key={i}>
            <th colSpan={group.colspan}>
              {group.month}
            </th>
            {showQuarterSummary && isQuarterEnd && (
              <>
                <th style={quarterHeaderStyle}>Н</th>
                <th style={quarterHeaderStyle}>Ф</th>
                <th style={quarterHeaderStyle}>Δ</th>
              </>
            )}
          </Fragment>
        );
      })}
    </tr>
  );
};

export default AdminMonthHeaders;
