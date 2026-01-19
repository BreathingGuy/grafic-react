import { memo, useCallback } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { useSelectionStore } from '../../../store/selectionStore';

/**
 * AdminHeader - Заголовок и кнопки управления админ-консоли
 *
 * Подписан только на hasUnsavedChanges и lastDraftSaved.
 */
const AdminHeader = memo(() => {
  const hasUnsavedChanges = useAdminStore(s => s.hasUnsavedChanges);
  const lastDraftSaved = useAdminStore(s => s.lastDraftSaved);
  const publishDraft = useAdminStore(s => s.publishDraft);
  const saveDraftToStorage = useAdminStore(s => s.saveDraftToStorage);
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

  const handleSaveDraft = useCallback(async () => {
    try {
      await saveDraftToStorage();
      alert('Черновик сохранен');
    } catch (error) {
      alert(`Ошибка сохранения: ${error.message}`);
    }
  }, [saveDraftToStorage]);

  const formatLastSaved = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Редактирование графика</h2>
        <div>
          <button onClick={handleDiscard} disabled={!hasUnsavedChanges}>
            Отменить
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={!hasUnsavedChanges}
            style={{
              marginLeft: '8px',
              backgroundColor: hasUnsavedChanges ? '#2196F3' : undefined,
              color: hasUnsavedChanges ? 'white' : undefined
            }}
          >
            Сохранить черновик
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
      {lastDraftSaved && (
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#666', marginTop: '4px' }}>
          Черновик сохранен: {formatLastSaved(lastDraftSaved)}
        </div>
      )}
    </div>
  );
});

AdminHeader.displayName = 'AdminHeader';

export default AdminHeader;
