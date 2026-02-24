import { memo } from 'react';
import { useAdminStore } from '../../../../store/admin';
import s from '../AdminPanel.module.css';

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
      className={hasUnsavedChanges ? s.actionBtnDraft : s.actionBtn}
    >
      Сохранить черновик
    </button>
  );
});

SaveDraftButton.displayName = 'SaveDraftButton';

export default SaveDraftButton;
