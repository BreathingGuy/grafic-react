import { memo } from 'react';
import { shallow } from 'zustand/shallow';
import { useAdminStore } from '../../../../store/adminStore';
import OffsetAdminEmployeeRow from '../../Rows/OffsetAdminEmployeeRow';

/**
 * OffsetAdminRows - Строки для offset таблицы (апрель-март)
 * Без props drilling - все дочерние компоненты знают свой selection store
 */
const OffsetAdminRows = memo(() => {
  const employeeIds = useAdminStore(state => state.employeeIds, shallow);

  return (
    <tbody>
      {employeeIds.map((empId, empIdx) => (
        <OffsetAdminEmployeeRow
          key={empId}
          empId={empId}
          empIdx={empIdx}
        />
      ))}
    </tbody>
  );
});

OffsetAdminRows.displayName = 'OffsetAdminRows';

export default OffsetAdminRows;
