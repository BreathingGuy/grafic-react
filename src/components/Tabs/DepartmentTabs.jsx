import {useMetaStore} from '../../store/metaStore'
import {useWorkspaceStore} from '../../store/workspaceStore'

export function DepartmentSelector() {
  const departmentsList = useMetaStore(state => state.departmentsList);  
  const currentDepartmentId = useWorkspaceStore(state => state.currentDepartmentId);
  const setDepartment = useWorkspaceStore(state => state.setDepartment);

  return (
    <select 
      value={currentDepartmentId || ''} 
      onChange={(e) => setDepartment(e.target.value)}
    >
      <option value="">Выберите отдел</option>
      {departmentsList.map(dept => (
        <option key={dept.id} value={dept.id}>{dept.name}</option>
      ))}
    </select>
  );
}
