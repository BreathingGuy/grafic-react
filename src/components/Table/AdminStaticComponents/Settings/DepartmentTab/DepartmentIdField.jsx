import { useAdminStore } from '../../../../../store/adminStore';
import { inputStyle } from '../settingsStyles';

/**
 * DepartmentIdField — отображение ID отдела (readonly)
 */
export default function DepartmentIdField() {
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontWeight: 500, marginBottom: '4px' }}>
        ID отдела
      </label>
      <input
        value={editingDepartmentId || ''}
        disabled
        style={{ ...inputStyle, backgroundColor: '#f5f5f5' }}
      />
    </div>
  );
}
