import { useEffect, useRef } from 'react';
import styles from './Table.module.css';

export default function CellEditor({ value, onChange, onClose }) {
  const selectRef = useRef(null);

  const statusOptions = [
    { value: '', label: '-' },
    { value: 'Д', label: 'Д (рабочий день)' },
    { value: 'В', label: 'В (выходной)' },
    { value: 'У', label: 'У (учёба)' },
    { value: 'О', label: 'О (отпуск)' },
    { value: 'ОВ', label: 'ОВ (отпуск)' },
    { value: 'Н1', label: 'Н1 (ночь)' },
    { value: 'Н2', label: 'Н2 (ночь)' },
    { value: 'ЭУ', label: 'ЭУ (экстра)' },
  ];

  useEffect(() => {
    // Автофокус на select
    selectRef.current?.focus();
  }, []);

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleBlur = () => {
    // Закрываем редактор при потере фокуса
    setTimeout(onClose, 150);
  };

  return (
    <select
      ref={selectRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={styles.cellEditor}
    >
      {statusOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
