import { memo } from 'react';
import { useAdminStore } from '../../../../store/admin';
import s from '../AdminPanel.module.css';

/**
 * PublishButton — кнопка публикации draft в production
 */
const PublishButton = memo(() => {
  const hasUnsavedChanges = useAdminStore(s => s.hasUnsavedChanges);

  const handlePublish = async () => {
    if (window.confirm('Опубликовать изменения?')) {
      const count = await useAdminStore.getState().publishDraft();
      alert(`Опубликовано ${count} изменений`);
    }
  };

  return (
    <button
      onClick={handlePublish}
      disabled={!hasUnsavedChanges}
      className={hasUnsavedChanges ? s.actionBtnPublish : s.actionBtn}
    >
      Опубликовать
    </button>
  );
});

PublishButton.displayName = 'PublishButton';

export default PublishButton;
