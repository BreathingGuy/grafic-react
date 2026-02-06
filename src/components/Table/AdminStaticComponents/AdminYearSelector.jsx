import { memo, useEffect } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { useVersionsStore } from '../../../store/versionsStore';

/**
 * AdminYearSelector — выбор года и версии для админа
 * Загружает список доступных годов при монтировании
 * Позволяет переключаться между годами и просматривать версии
 */
const AdminYearSelector = memo(() => {
  // Из adminStore
  const editingYear = useAdminStore(s => s.editingYear);
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);
  const availableYears = useAdminStore(s => s.availableYears);
  const loadingYears = useAdminStore(s => s.loadingYears);
  const hasUnsavedChanges = useAdminStore(s => s.hasUnsavedChanges);

  const loadAvailableYears = useAdminStore(s => s.loadAvailableYears);
  const switchYear = useAdminStore(s => s.switchYear);
  const loadVersion = useAdminStore(s => s.loadVersion);
  const exitVersionView = useAdminStore(s => s.exitVersionView);
  const createNewYear = useAdminStore(s => s.createNewYear);

  // Из versionsStore (изолирован от employeeIds)
  const yearVersions = useVersionsStore(s => s.yearVersions);
  const selectedVersion = useVersionsStore(s => s.selectedVersion);
  const loadingVersions = useVersionsStore(s => s.loadingVersions);
  const loadYearVersions = useVersionsStore(s => s.loadYearVersions);

  // Загрузить список годов при инициализации
  useEffect(() => {
    if (editingDepartmentId && availableYears.length === 0) {
      loadAvailableYears(editingDepartmentId);
    }
  }, [editingDepartmentId, availableYears.length, loadAvailableYears]);

  // Загрузить версии при смене года
  useEffect(() => {
    if (editingDepartmentId && editingYear && yearVersions.length === 0) {
      loadYearVersions(editingDepartmentId, editingYear);
    }
  }, [editingDepartmentId, editingYear, yearVersions.length, loadYearVersions]);

  const handleYearChange = async (e) => {
    const newYear = e.target.value;
    if (newYear === String(editingYear)) return;

    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Есть несохранённые изменения. Переключить год без сохранения?'
      );
      if (!confirmed) return;
    }

    await switchYear(newYear);
  };

  const handleVersionChange = async (e) => {
    const version = e.target.value;

    if (version === '') {
      // Вернуться к текущему draft
      await exitVersionView();
    } else {
      await loadVersion(version);
    }
  };

  const handleCreateNewYear = async () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Есть несохранённые изменения. Продолжить без сохранения?'
      );
      if (!confirmed) return;
    }

    // Определяем следующий год (максимальный + 1)
    const maxYear = Math.max(...availableYears.map(y => Number(y)));
    const newYear = maxYear + 1;

    const confirmed = window.confirm(
      `Создать новый год ${newYear}?\n\nБудут созданы пустые ячейки для всех сотрудников (включая Q1 ${newYear + 1} для offset таблицы).`
    );

    if (!confirmed) return;

    await createNewYear(newYear);
  };

  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      {/* Выбор года */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontWeight: 500 }}>Год:</label>
        <select
          value={editingYear || ''}
          onChange={handleYearChange}
          disabled={loadingYears}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '14px',
            minWidth: '100px'
          }}
        >
          {loadingYears ? (
            <option>Загрузка...</option>
          ) : (
            availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))
          )}
        </select>

        {/* Кнопка создания нового года */}
        <button
          onClick={handleCreateNewYear}
          disabled={loadingYears || !editingDepartmentId}
          style={{
            padding: '6px 12px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            opacity: (loadingYears || !editingDepartmentId) ? 0.5 : 1
          }}
          title="Создать следующий год"
        >
          + Новый год
        </button>
      </div>

      {/* Выбор версии */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontWeight: 500 }}>Версия:</label>
        <select
          value={selectedVersion || ''}
          onChange={handleVersionChange}
          disabled={loadingVersions}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '14px',
            minWidth: '140px',
            backgroundColor: selectedVersion ? '#fff3cd' : 'white'
          }}
        >
          <option value="">Текущий draft</option>
          {loadingVersions ? (
            <option disabled>Загрузка...</option>
          ) : (
            yearVersions.map(version => (
              <option key={version} value={version}>{version}</option>
            ))
          )}
        </select>
      </div>

      {/* Индикатор просмотра версии */}
      {selectedVersion && (
        <span style={{
          padding: '4px 8px',
          backgroundColor: '#fff3cd',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#856404'
        }}>
          Просмотр версии (только чтение)
        </span>
      )}
    </div>
  );
});

AdminYearSelector.displayName = 'AdminYearSelector';

export default AdminYearSelector;
