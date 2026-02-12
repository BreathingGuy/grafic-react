import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useMetaStore } from '../../../store/metaStore';
import styles from '../Table.module.css';

export default function CellEditor({ value, onChange, onClose }) {
  const containerRef = useRef(null);
  const [selectedValue, setSelectedValue] = useState(value);

  const currentConfig = useMetaStore(s => s.currentDepartmentConfig);

  const statusOptions = useMemo(() => {
    const options = [{ value: '', label: '-' }];
    if (currentConfig?.statusConfig) {
      currentConfig.statusConfig.forEach(s => {
        options.push({ value: s.code, label: `${s.code} (${s.label})` });
      });
    }
    return options;
  }, [currentConfig]);

  // Закрытие при клике вне редактора
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Добавляем с задержкой, чтобы не сработал на текущий клик
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Обработка Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Применить значение и закрыть
  const handleSelect = useCallback((newValue) => {
    onChange(newValue);
  }, [onChange]);

  // Остановка событий мыши (чтобы не триггерить selection)
  const stopPropagation = useCallback((e) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles.cellEditor}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      onMouseOver={stopPropagation}
      onClick={stopPropagation}
      onDoubleClick={stopPropagation}
    >
      {statusOptions.map(option => (
        <div
          key={option.value}
          className={`${styles.cellEditorOption} ${selectedValue === option.value ? styles.cellEditorOptionSelected : ''}`}
          onMouseEnter={() => setSelectedValue(option.value)}
          onClick={() => handleSelect(option.value)}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
}
