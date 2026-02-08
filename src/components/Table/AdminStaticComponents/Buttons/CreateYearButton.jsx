import { memo } from 'react';
import { useAdminStore } from '../../../../store/adminStore';

/**
 * CreateYearButton — кнопка создания нового года
 * Создаёт max(availableYears) + 1 с пустыми ячейками
 */
const CreateYearButton = memo(() => {
  const availableYears = useAdminStore(s => s.availableYears);
  const loadingYears = useAdminStore(s => s.loadingYears);
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);
  const hasUnsavedChanges = useAdminStore(s => s.hasUnsavedChanges);

  const disabled = loadingYears || !editingDepartmentId;

  const handleCreateNewYear = async () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Есть несохранённые изменения. Продолжить без сохранения?'
      );
      if (!confirmed) return;
    }

    const maxYear = Math.max(...availableYears.map(y => Number(y)));
    const newYear = maxYear + 1;

    const confirmed = window.confirm(
      `Создать новый год ${newYear}?\n\nБудут созданы пустые ячейки для всех сотрудников (включая Q1 ${newYear + 1} для offset таблицы).`
    );

    if (!confirmed) return;

    await useAdminStore.getState().createNewYear(newYear);
  };

  return (
    <button
      onClick={handleCreateNewYear}
      disabled={disabled}
      style={{
        padding: '6px 12px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        opacity: disabled ? 0.5 : 1
      }}
      title="Создать следующий год"
    >
      + Новый год
    </button>
  );
});

CreateYearButton.displayName = 'CreateYearButton';

export default CreateYearButton;
