import { useAdminStore } from '../../../../../store/admin';
import css from '../Settings.module.css';

/**
 * DepartmentIdField — отображение ID отдела (readonly)
 */
export default function DepartmentIdField() {
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);

  return (
    <div className={css.fieldGroup}>
      <label className={css.label}>
        ID отдела
      </label>
      <input
        value={editingDepartmentId || ''}
        disabled
        className={css.inputDisabled}
      />
    </div>
  );
}
