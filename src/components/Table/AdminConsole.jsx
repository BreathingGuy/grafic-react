import { useEffect } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useAdminStore } from '../../store/adminStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useDateStore } from '../../store/dateStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

import FixedEmployeeColumn from './Static/FixedEmployeeColumn';
import AdminScrollableScheduleTable from './Scrollable/AdminScrollableScheduleTable';

import styles from './Table.module.css';

/**
 * AdminConsole - Таблица для редактирования графика
 *
 * Трёхуровневая модель данных:
 * - Local Changes: несохранённые изменения в браузере
 * - Shared Draft: общий драфт, синхронизируемый между админами
 * - Production: опубликованные данные (видимые пользователям)
 *
 * Функционал:
 * - Drag-выделение ячеек (через SelectionOverlay)
 * - Ctrl+C/V/Z для копирования/вставки/отмены
 * - Редактирование по двойному клику
 * - "Сохранить" — Local → Shared Draft
 * - "Опубликовать" — Shared Draft → Production
 */
function AdminConsole() {
  // Из scheduleStore только читаем production данные
  const employeeIds = useScheduleStore(s => s.employeeIds);

  // Из adminStore — всё что касается редактирования
  const initializeDraft = useAdminStore(s => s.initializeDraft);
  const saveDraft = useAdminStore(s => s.saveDraft);
  const publishDraft = useAdminStore(s => s.publishDraft);
  const discardLocalChanges = useAdminStore(s => s.discardLocalChanges);
  const discardDraft = useAdminStore(s => s.discardDraft);
  const clearDraft = useAdminStore(s => s.clearDraft);

  // Флаги состояния
  const hasLocalChanges = useAdminStore(s => s.hasLocalChanges);
  const draftDiffersFromProduction = useAdminStore(s => s.draftDiffersFromProduction);

  // Текущий год и навигация
  const currentYear = useDateStore(s => s.currentYear);
  const setAdminMode = useDateStore(s => s.setAdminMode);
  const setYear = useDateStore(s => s.setYear);

  // Год, для которого редактируется draft
  const editingYear = useAdminStore(s => s.editingYear);

  const statusMessage = useSelectionStore(s => s.statusMessage);
  const startCell = useSelectionStore(s => s.startCell);
  const endCell = useSelectionStore(s => s.endCell);
  const clearSelection = useSelectionStore(s => s.clearSelection);

  // Вычисляем количество выбранных ячеек
  const selectedCount = startCell && endCell && employeeIds.length > 0
    ? useSelectionStore.getState().getSelectedCount(employeeIds)
    : 0;

  // Keyboard shortcuts
  useKeyboardShortcuts();

  // Инициализация при монтировании
  useEffect(() => {
    // Включаем режим админа (без ограничений навигации)
    setAdminMode(true);
    // Инициализируем draft для текущего года
    initializeDraft(currentYear);

    return () => {
      // При выходе — выключаем режим админа и очищаем
      setAdminMode(false);
      clearDraft();
      clearSelection();
    };
  }, [currentYear, initializeDraft, setAdminMode, clearDraft, clearSelection]);

  // === HANDLERS ===

  // Сохранить локальные изменения в shared draft (синхронизация между админами)
  const handleSaveDraft = async () => {
    const count = await saveDraft();
    if (count > 0) {
      alert(`Сохранено в драфт: ${count} изменений`);
    }
  };

  // Опубликовать shared draft в production
  const handlePublish = async () => {
    if (window.confirm('Опубликовать изменения? Они станут видны всем пользователям.')) {
      const count = await publishDraft();
      alert(`Опубликовано ${count} изменений`);
    }
  };

  // Отменить локальные изменения (вернуться к shared draft)
  const handleDiscardLocal = () => {
    if (window.confirm('Отменить локальные изменения?')) {
      discardLocalChanges();
      clearSelection();
    }
  };

  // Отменить весь драфт (вернуться к production)
  const handleDiscardAll = () => {
    if (window.confirm('Сбросить драфт до состояния production?')) {
      discardDraft();
      clearSelection();
    }
  };

  // Переход к другому году
  const handleYearChange = async (newYear) => {
    // Если есть несохранённые изменения — спрашиваем
    if (hasLocalChanges) {
      const action = window.confirm(
        'Есть несохранённые изменения. Сохранить перед переходом?\n\n' +
        'OK = Сохранить и перейти\n' +
        'Отмена = Остаться на текущем году'
      );

      if (action) {
        await saveDraft();
      } else {
        return; // Остаёмся
      }
    }

    // Очищаем выделение
    clearSelection();

    // Переходим к новому году (dateStore.setYear расширит индекс если нужно)
    setYear(newYear);

    // Инициализируем draft для нового года
    initializeDraft(newYear);
  };

  // Навигация по годам
  const handlePrevYear = () => handleYearChange(currentYear - 1);
  const handleNextYear = () => handleYearChange(currentYear + 1);

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ margin: 0 }}>Редактирование графика</h2>

          {/* Year Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px'
          }}>
            <button
              onClick={handlePrevYear}
              style={{
                padding: '4px 8px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              title="Предыдущий год"
            >
              ◀
            </button>

            <span style={{
              fontWeight: 'bold',
              fontSize: '16px',
              minWidth: '50px',
              textAlign: 'center'
            }}>
              {editingYear || currentYear}
            </span>

            <button
              onClick={handleNextYear}
              style={{
                padding: '4px 8px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              title="Следующий год"
            >
              ▶
            </button>

            {/* Индикатор нового года */}
            {draftDiffersFromProduction && editingYear && (
              <span style={{
                fontSize: '12px',
                color: '#ff9800',
                marginLeft: '4px'
              }}>
                (новый)
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Отмена локальных изменений */}
          <button
            onClick={handleDiscardLocal}
            disabled={!hasLocalChanges}
            style={{ opacity: hasLocalChanges ? 1 : 0.5 }}
          >
            Отменить
          </button>

          {/* Сохранить в драфт (Local → Shared Draft) */}
          <button
            onClick={handleSaveDraft}
            disabled={!hasLocalChanges}
            style={{
              backgroundColor: hasLocalChanges ? '#2196f3' : undefined,
              color: hasLocalChanges ? 'white' : undefined
            }}
          >
            Сохранить
          </button>

          {/* Разделитель */}
          <span style={{ color: '#ccc', margin: '0 4px' }}>|</span>

          {/* Сброс драфта к production */}
          <button
            onClick={handleDiscardAll}
            disabled={!draftDiffersFromProduction}
            style={{ opacity: draftDiffersFromProduction ? 1 : 0.5 }}
          >
            Сбросить
          </button>

          {/* Опубликовать (Shared Draft → Production) */}
          <button
            onClick={handlePublish}
            disabled={!draftDiffersFromProduction && !hasLocalChanges}
            style={{
              backgroundColor: (draftDiffersFromProduction || hasLocalChanges) ? '#4caf50' : undefined,
              color: (draftDiffersFromProduction || hasLocalChanges) ? 'white' : undefined
            }}
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
          {hasLocalChanges && (
            <span style={{ marginLeft: '12px', color: '#2196f3' }}>
              ● Есть несохранённые изменения
            </span>
          )}
          {draftDiffersFromProduction && !hasLocalChanges && (
            <span style={{ marginLeft: '12px', color: '#ff9800' }}>
              ● Драфт отличается от production
            </span>
          )}
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
        <AdminScrollableScheduleTable />
      </div>
    </div>
  );
}


export default AdminConsole;
