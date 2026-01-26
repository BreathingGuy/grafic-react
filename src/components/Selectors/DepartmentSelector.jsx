import { memo } from 'react';
import { useMetaStore } from '../../store/metaStore';
import { useWorkspaceStore } from '../../store/workspaceStore';

/**
 * DepartmentSelector - Выбор отдела
 * Мемоизирован для предотвращения лишних ререндеров от родителя
 */
export const DepartmentSelector = memo(() => {
  const departmentsList = useMetaStore(state => state.departmentsList);
  const currentDepartmentId = useWorkspaceStore(state => state.currentDepartmentId);

  const handleChange = (e) => {
    useWorkspaceStore.getState().setDepartment(e.target.value);
  };

  return (
    <select
      value={currentDepartmentId || ''}
      onChange={handleChange}
    >
      <option value="">Выберите отдел</option>
      {departmentsList.map(dept => (
        <option key={dept.id} value={dept.id}>{dept.name}</option>
      ))}
    </select>
  );
});

DepartmentSelector.displayName = 'DepartmentSelector';
