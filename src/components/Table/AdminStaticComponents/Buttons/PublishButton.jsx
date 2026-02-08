import { memo } from 'react';
import { useAdminStore } from '../../../../store/adminStore';

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
      style={{
        marginLeft: '8px',
        backgroundColor: hasUnsavedChanges ? '#4caf50' : undefined,
        color: hasUnsavedChanges ? 'white' : undefined
      }}
    >
      Опубликовать
    </button>
  );
});

PublishButton.displayName = 'PublishButton';

export default PublishButton;
