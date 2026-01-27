import { memo } from 'react';
import { useAdminStore } from '../../../../store/adminStore';

import AdminEmployeeRow from '../../Rows/AdminEmployeeRow';

const AdminRows = memo(({ tableId, useSelectionStore }) => {
    const employeeIds = useAdminStore(state => state.employeeIds);

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
    )
})

export default AdminRows;
