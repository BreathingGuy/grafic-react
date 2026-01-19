import { useState } from 'react';
import styles from './StatusConfigEditor.module.css';

/**
 * StatusConfigEditor - Редактор конфигурации статусов
 *
 * Позволяет настраивать:
 * - codeList - обозначение в листе и графике (что видит пользователь)
 * - codeWork - код для базы данных (статичный параметр)
 * - label - название статуса
 * - colorBackground - цвет фона ячейки
 * - colorText - цвет текста
 * - description - описание статуса
 */
export default function StatusConfigEditor({ statusConfig, onChange }) {
  const handleAdd = () => {
    onChange([
      ...statusConfig,
      {
        codeList: '',
        codeWork: '',
        label: '',
        colorBackground: '#ffffff',
        colorText: '#000000',
        description: ''
      }
    ]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...statusConfig];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleRemove = (index) => {
    if (statusConfig.length === 1) {
      alert('Должен остаться хотя бы один статус');
      return;
    }
    onChange(statusConfig.filter((_, i) => i !== index));
  };

  const handleDuplicate = (index) => {
    const duplicated = { ...statusConfig[index] };
    onChange([
      ...statusConfig.slice(0, index + 1),
      duplicated,
      ...statusConfig.slice(index + 1)
    ]);
  };

  // Предустановленные статусы для быстрого добавления
  const presets = [
    {
      codeList: 'Д',
      codeWork: 'working',
      label: 'Дневная смена',
      colorBackground: '#d4edda',
      colorText: '#155724',
      description: 'с 8 до 16.30 вечера'
    },
    {
      codeList: 'Н1',
      codeWork: 'night1',
      label: 'Ночная смена первая',
      colorBackground: '#cfe2ff',
      colorText: '#084298',
      description: 'с 4 вечера до 12 ночи'
    },
    {
      codeList: 'Н2',
      codeWork: 'night2',
      label: 'Ночная смена вторая',
      colorBackground: '#cfe2ff',
      colorText: '#084298',
      description: 'с 12 ночи до 8 утра'
    },
    {
      codeList: 'В',
      codeWork: 'dayoff',
      label: 'Выходной',
      colorBackground: '#f8d7da',
      colorText: '#721c24',
      description: 'Выходной день'
    },
    {
      codeList: 'О',
      codeWork: 'vacation',
      label: 'Отпуск',
      colorBackground: '#fff3cd',
      colorText: '#856404',
      description: 'Отпуск'
    },
    {
      codeList: 'У',
      codeWork: 'study',
      label: 'Учеба',
      colorBackground: '#d1ecf1',
      colorText: '#0c5460',
      description: 'Учебный день'
    }
  ];

  const handleAddPreset = (preset) => {
    onChange([...statusConfig, { ...preset }]);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Конфигурация статусов</h3>
        <button className={styles.addButton} onClick={handleAdd}>
          + Добавить статус
        </button>
      </div>

      {/* Быстрые пресеты */}
      <div className={styles.presetsSection}>
        <p className={styles.presetsTitle}>Быстрое добавление:</p>
        <div className={styles.presetsList}>
          {presets.map((preset, index) => (
            <button
              key={index}
              className={styles.presetButton}
              onClick={() => handleAddPreset(preset)}
              style={{
                backgroundColor: preset.colorBackground,
                color: preset.colorText
              }}
            >
              {preset.codeList} - {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.list}>
        {statusConfig.map((status, index) => (
          <div key={index} className={styles.statusCard}>
            <div className={styles.cardHeader}>
              <span className={styles.statusNumber}>#{index + 1}</span>
              <div className={styles.preview} style={{
                backgroundColor: status.colorBackground,
                color: status.colorText
              }}>
                {status.codeList || '?'}
              </div>
              <div className={styles.actions}>
                <button
                  className={styles.duplicateButton}
                  onClick={() => handleDuplicate(index)}
                  title="Дублировать"
                >
                  📋
                </button>
                {statusConfig.length > 1 && (
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemove(index)}
                    title="Удалить"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className={styles.fields}>
              {/* Коды */}
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>
                    Code List *
                    <span className={styles.hint}>Отображается в графике</span>
                  </label>
                  <input
                    type="text"
                    value={status.codeList}
                    onChange={(e) => handleChange(index, 'codeList', e.target.value)}
                    placeholder="Д"
                    maxLength={3}
                  />
                </div>

                <div className={styles.field}>
                  <label>
                    Code Work *
                    <span className={styles.hint}>Код для базы данных</span>
                  </label>
                  <input
                    type="text"
                    value={status.codeWork}
                    onChange={(e) => handleChange(index, 'codeWork', e.target.value)}
                    placeholder="working"
                  />
                </div>
              </div>

              {/* Название */}
              <div className={styles.field}>
                <label>Название *</label>
                <input
                  type="text"
                  value={status.label}
                  onChange={(e) => handleChange(index, 'label', e.target.value)}
                  placeholder="Дневная смена"
                />
              </div>

              {/* Цвета */}
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Цвет фона *</label>
                  <div className={styles.colorPicker}>
                    <input
                      type="color"
                      value={status.colorBackground}
                      onChange={(e) => handleChange(index, 'colorBackground', e.target.value)}
                    />
                    <input
                      type="text"
                      value={status.colorBackground}
                      onChange={(e) => handleChange(index, 'colorBackground', e.target.value)}
                      placeholder="#d4edda"
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Цвет текста *</label>
                  <div className={styles.colorPicker}>
                    <input
                      type="color"
                      value={status.colorText}
                      onChange={(e) => handleChange(index, 'colorText', e.target.value)}
                    />
                    <input
                      type="text"
                      value={status.colorText}
                      onChange={(e) => handleChange(index, 'colorText', e.target.value)}
                      placeholder="#155724"
                    />
                  </div>
                </div>
              </div>

              {/* Описание */}
              <div className={styles.field}>
                <label>Описание</label>
                <input
                  type="text"
                  value={status.description}
                  onChange={(e) => handleChange(index, 'description', e.target.value)}
                  placeholder="с 8 до 16.30 вечера"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {statusConfig.length === 0 && (
        <div className={styles.emptyState}>
          <p>Нет статусов. Добавьте хотя бы один.</p>
        </div>
      )}
    </div>
  );
}
