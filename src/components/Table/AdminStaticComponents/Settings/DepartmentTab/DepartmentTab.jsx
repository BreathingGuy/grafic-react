import DepartmentIdField from './DepartmentIdField';
import s from '../Settings.module.css';

/**
 * DepartmentTab — вкладка настроек отдела (controlled)
 * Props: name, onNameChange
 */
export default function DepartmentTab({ name, onNameChange }) {
  return (
    <div>
      <DepartmentIdField />
      <div className={s.fieldGroup}>
        <label className={s.label}>
          Название отдела
        </label>
        <input
          value={name}
          onChange={e => onNameChange(e.target.value)}
          className={s.input}
          style={{ width: '300px' }}
        />
      </div>
    </div>
  );
}
