import { memo } from "react";
import { shallow } from 'zustand/shallow';
import { useAdminStore } from '../../../store/adminStore';

import AdminEmployeeNameCell from './AdminEmployeeNameCell';

import styles from '../Table.module.css';

/**
 * AdminFixedEmployeeColumn — фиксированная колонка с именами сотрудников для админа
 * Берёт данные из adminStore вместо scheduleStore
 */
const AdminFixedEmployeeColumn = memo(() => {
  // Используем shallow comparison для предотвращения лишних перерендеров
  const employeeIds = useAdminStore(state => state.employeeIds, shallow);

  return (
    <table className={styles.fixed_column}>
      <thead>
        <tr>
          <th></th>
        </tr>
        <tr>
          <th></th>
        </tr>
      </thead>

      <tbody>
        {employeeIds.map(empId => (
          <AdminEmployeeNameCell key={empId} empId={empId} />
        ))}
      </tbody>
    </table>
  );
});

AdminFixedEmployeeColumn.displayName = 'AdminFixedEmployeeColumn';

export default AdminFixedEmployeeColumn;
