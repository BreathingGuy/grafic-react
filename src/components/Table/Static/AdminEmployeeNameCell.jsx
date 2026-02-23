import { memo } from 'react';
import { useAdminStore } from '../../../store/adminStore';

/**
 * AdminEmployeeNameCell — ячейка с именем сотрудника для админа
 * Точечные селекторы на примитивы — ререндер только при изменении имени конкретного сотрудника
 */
const AdminEmployeeNameCell = memo(({ empId }) => {
  const name = useAdminStore(state => state.employeeById[empId]?.name);
  const fullName = useAdminStore(state => state.employeeById[empId]?.fullName);

  if (!name) {
    return (
      <tr>
        <td>—</td>
      </tr>
    );
  }

  return (
    <tr>
      <td title={fullName}>
        {name}
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  return prevProps.empId === nextProps.empId;
});

AdminEmployeeNameCell.displayName = 'AdminEmployeeNameCell';

export default AdminEmployeeNameCell;
