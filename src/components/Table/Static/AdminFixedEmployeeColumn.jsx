import { memo } from "react";
import { useAdminStore } from '../../../store/adminStore';

import AdminEmployeeNameCell from './AdminEmployeeNameCell';

import styles from '../Table.module.css';

/**
 * AdminFixedEmployeeColumn — фиксированная колонка с именами сотрудников для админа
 * Берёт данные из adminStore вместо scheduleStore
 */
const AdminFixedEmployeeColumn = memo(() => {
  // Object.is для сравнения ссылок — предотвращает ре-рендер при изменении других полей стора
  const employeeIds = useAdminStore(state => state.employeeIds, Object.is);

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
