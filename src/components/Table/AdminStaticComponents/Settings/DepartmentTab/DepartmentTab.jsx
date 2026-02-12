import DepartmentIdField from './DepartmentIdField';
import DepartmentNameField from './DepartmentNameField';

/**
 * DepartmentTab — вкладка настроек отдела
 * Композиция: ID (readonly) + редактирование имени
 */
export default function DepartmentTab() {
  return (
    <div>
      <DepartmentIdField />
      <DepartmentNameField />
    </div>
  );
}
