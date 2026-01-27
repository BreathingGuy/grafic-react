import { memo } from 'react';
import { shallow } from 'zustand/shallow';
import { useAdminStore } from '../../../../store/adminStore';
import MainAdminEmployeeRow from '../../Rows/MainAdminEmployeeRow';

/**
 * MainAdminRows - Строки для main таблицы (январь-декабрь)
 * Без props drilling - все дочерние компоненты знают свой selection store
 */
const MainAdminRows = memo(() => {
  const employeeIds = useAdminStore(state => state.employeeIds, shallow);

  return (
    <tbody>
      {employeeIds.map((empId, empIdx) => (
        <MainAdminEmployeeRow
          key={empId}
          empId={empId}
          empIdx={empIdx}
        />
      ))}
    </tbody>
  );
});

MainAdminRows.displayName = 'MainAdminRows';

export default MainAdminRows;
