import { memo } from 'react';
import { useMetaStore } from '../../store/metaStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import s from '../Table/AdminStaticComponents/AdminPanel.module.css';

/**
 * AdminDepartmentSelector - Выбор отдела для админ-режима
 *
 * В отличие от DepartmentSelector:
 * - Вызывает setAdminDepartment (не загружает user data)
 * - AdminConsole сам загрузит данные через initializeDraft
 */
export const AdminDepartmentSelector = memo(() => {
  const departmentsList = useMetaStore(state => state.departmentsList);
  const currentDepartmentId = useWorkspaceStore(state => state.currentDepartmentId);

  const handleChange = (e) => {
    useWorkspaceStore.getState().setAdminDepartment(e.target.value);
  };

  return (
    <select
      value={currentDepartmentId || ''}
      onChange={handleChange}
      className={s.select}
    >
      <option value="">Выберите отдел</option>
      {departmentsList.map(dept => (
        <option key={dept.id} value={dept.id}>{dept.name}</option>
      ))}
    </select>
  );
});

AdminDepartmentSelector.displayName = 'AdminDepartmentSelector';
