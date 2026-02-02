import { memo } from 'react';
import { shallow } from 'zustand/shallow';
import { useAdminStore } from '../../../../store/adminStore';
import AdminEmployeeRow from '../../Rows/AdminEmployeeRow';

/**
 * AdminRows - Строки таблицы расписания для админ-режима
 *
 * @param {string} tableId - 'main' | 'offset'
 * @param {Function} useSelectionStore - хук selection store
 */
const AdminRows = memo(({ tableId = 'main', useSelectionStore }) => {
  const employeeIds = useAdminStore(state => state.employeeIds, shallow);

  return (
    <tbody>
      {employeeIds.map((empId, empIdx) => (
        <AdminEmployeeRow
          key={empId}
          empId={empId}
          empIdx={empIdx}
          tableId={tableId}
          useSelectionStore={useSelectionStore}
        />
      ))}
    </tbody>
  );
}, (prev, next) =>
  prev.tableId === next.tableId &&
  prev.useSelectionStore === next.useSelectionStore
);

AdminRows.displayName = 'AdminRows';

export default AdminRows;
