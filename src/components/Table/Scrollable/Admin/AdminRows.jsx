import { memo } from 'react';
import { shallow } from 'zustand/shallow';
import { useAdminStore } from '../../../../store/adminStore';

import AdminEmployeeRow from '../../Rows/AdminEmployeeRow';

const AdminRows = memo(({ tableId = 'main', useSelectionStore }) => {
    // Используем shallow comparison для предотвращения лишних перерендеров
    // при изменении других частей adminStore
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
    )
})

export default AdminRows;
