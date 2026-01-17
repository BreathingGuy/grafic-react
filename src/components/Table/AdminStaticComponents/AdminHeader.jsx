import { memo, useCallback } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { useSelectionStore } from '../../../store/selectionStore';

/**
 * AdminHeader - Заголовок и кнопки управления админ-консоли
 *
 * Подписан только на hasUnsavedChanges, не вызывает ререндер таблицы.
 */
const AdminHeader = memo(() => {
  const hasUnsavedChanges = useAdminStore(s => s.hasUnsavedChanges);
  const publishDraft = useAdminStore(s => s.publishDraft);
  const discardDraft = useAdminStore(s => s.discardDraft);
  const clearSelection = useSelectionStore(s => s.clearSelection);

  const handlePublish = useCallback(async () => {
    if (window.confirm('Опубликовать изменения?')) {
      const count = await publishDraft();
      alert(`Опубликовано ${count} изменений`);
    }
  }, [publishDraft]);

  const handleDiscard = useCallback(() => {
    if (window.confirm('Отменить все изменения?')) {
      discardDraft();
      clearSelection();
    }
  }, [discardDraft, clearSelection]);

  return (
    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ margin: 0 }}>Редактирование графика</h2>
      <div>
        <button onClick={handleDiscard} disabled={!hasUnsavedChanges}>
          Отменить
        </button>
        <button
          onClick={handlePublish}
          disabled={!hasUnsavedChanges}
          style={{
            marginLeft: '8px',
            backgroundColor: hasUnsavedChanges ? '#4caf50' : undefined,
            color: hasUnsavedChanges ? 'white' : undefined
          }}
        >
          Опубликовать
        </button>
      </div>
    </div>
  );
});

AdminHeader.displayName = 'AdminHeader';

export default AdminHeader;
