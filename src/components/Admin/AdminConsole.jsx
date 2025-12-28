import { useEffect } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useDateStore } from '../../store/dateStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

import AdminEmployeeRow from './AdminEmployeeRow';
import MonthHeaders from '../Table/MonthHeaders';
import FixedEmployeeColumn from '../Table/Static/FixedEmployeeColumn';

import styles from '../Table/Table.module.css';

/**
 * AdminConsole - Таблица для редактирования графика
 *
 * Функционал:
 * - Drag-выделение ячеек
 * - Ctrl+C/V/Z для копирования/вставки/отмены
 * - Редактирование по двойному клику
 * - Сохранение/публикация изменений
 */
export default function AdminConsole() {
  // Stores
  const employeeIds = useScheduleStore(s => s.employeeIds);
  const initializeDraft = useScheduleStore(s => s.initializeDraft);
  const publishDraft = useScheduleStore(s => s.publishDraft);
  const discardDraft = useScheduleStore(s => s.discardDraft);
  const hasUnsavedChanges = useScheduleStore(s => s.hasUnsavedChanges);

  const visibleSlots = useDateStore(s => s.visibleSlots);
  const slotToDay = useDateStore(s => s.slotToDay);
  const slotToDate = useDateStore(s => s.slotToDate);
  const monthGroups = useDateStore(s => s.monthGroups);

  const statusMessage = useSelectionStore(s => s.statusMessage);
  const selectedCount = useSelectionStore(s => s.selectedCells.size);
  const clearSelection = useSelectionStore(s => s.clearSelection);

  // Keyboard shortcuts
  useKeyboardShortcuts();

  // Инициализация draft при монтировании
  useEffect(() => {
    initializeDraft();
    return () => clearSelection();
  }, [initializeDraft, clearSelection]);

  // Handlers
  const handlePublish = () => {
    if (window.confirm('Опубликовать изменения?')) {
      const count = publishDraft();
      alert(`Опубликовано ${count} изменений`);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Отменить все изменения?')) {
      discardDraft();
      clearSelection();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Редактирование графика</h2>
        <div>
          <button onClick={handleDiscard} disabled={!hasUnsavedChanges}>
            Отменить
          </button>
          <button
            onClick={handlePublish}
            disabled={!hasUnsavedChanges}
            style={{ backgroundColor: hasUnsavedChanges ? '#4caf50' : undefined, color: hasUnsavedChanges ? 'white' : undefined }}
          >
            Опубликовать
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        marginBottom: '12px',
        padding: '8px 12px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        fontSize: '14px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>
          {statusMessage || (selectedCount > 0 ? `Выбрано: ${selectedCount} ячеек` : 'Выделите ячейки для редактирования')}
        </span>
        <span style={{ color: '#666' }}>
          Ctrl+C копировать | Ctrl+V вставить | Ctrl+Z отменить | Esc снять выделение
        </span>
      </div>

      {/* Table */}
      <div className={styles.container}>
        {/* Левая колонка - имена */}
        <FixedEmployeeColumn />

        {/* Правая колонка - график */}
        <div className={styles.scrollable_container}>
          <table className={styles.scrollable_column}>
            <thead>
              <MonthHeaders monthGroups={monthGroups} />
              <tr>
                {visibleSlots.map(slotIndex => {
                  const date = slotToDate[slotIndex];
                  if (!date) return null;
                  return (
                    <th key={slotIndex}>
                      {slotToDay[slotIndex]}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {employeeIds.map(empId => (
                <AdminEmployeeRow key={empId} empId={empId} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
