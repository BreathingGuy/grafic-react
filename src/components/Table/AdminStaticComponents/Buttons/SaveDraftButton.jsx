import { memo } from 'react';
import { useAdminStore } from '../../../../store/adminStore';

/**
 * SaveDraftButton — кнопка сохранения черновика в localStorage
 */
const SaveDraftButton = memo(() => {
  const hasUnsavedChanges = useAdminStore(s => s.hasUnsavedChanges);

  const handleSaveDraft = async () => {
    try {
      await useAdminStore.getState().saveDraftToStorage();
      alert('Черновик сохранен');
    } catch (error) {
      alert(`Ошибка сохранения: ${error.message}`);
    }
  };

  return (
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
  );
});

SaveDraftButton.displayName = 'SaveDraftButton';

export default SaveDraftButton;
