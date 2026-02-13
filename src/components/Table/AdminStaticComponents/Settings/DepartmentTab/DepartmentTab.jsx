import DepartmentIdField from './DepartmentIdField';
import { inputStyle } from '../settingsStyles';

/**
 * DepartmentTab — вкладка настроек отдела (controlled)
 * Props: name, onNameChange
 */
export default function DepartmentTab({ name, onNameChange }) {
  return (
    <div>
      <DepartmentIdField />
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: 500, marginBottom: '4px' }}>
          Название отдела
        </label>
        <input
          value={name}
          onChange={e => onNameChange(e.target.value)}
          style={{ ...inputStyle, width: '300px' }}
        />
      </div>
    </div>
  );
}
