import { memo } from 'react';
import { useAdminStore } from '../../../store/adminStore';

/**
 * AdminEmployeeNameCell — ячейка с именем сотрудника для админа
 * Берёт данные из adminStore.employeeById
 */
const AdminEmployeeNameCell = memo(({ empId }) => {
  const employee = useAdminStore(state => state.employeeById[empId]);

  if (!employee) {
    return (
      <tr>
        <td>—</td>
      </tr>
    );
  }

  return (
    <tr>
      <td title={employee.fullName}>
        {employee.name}
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  return prevProps.empId === nextProps.empId;
});

AdminEmployeeNameCell.displayName = 'AdminEmployeeNameCell';

export default AdminEmployeeNameCell;
