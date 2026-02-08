import { memo } from 'react';
import { useAdminStore } from '../../../../store/adminStore';
import { useClipboardStore } from '../../../../store/selection';

/**
 * DiscardButton — кнопка отмены всех изменений (возврат draft к original)
 */
const DiscardButton = memo(() => {
  const hasUnsavedChanges = useAdminStore(s => s.hasUnsavedChanges);

  const handleDiscard = () => {
    if (window.confirm('Отменить все изменения?')) {
      useAdminStore.getState().discardDraft();
      useClipboardStore.getState().clearAllSelections();
    }
  };

  return (
    <button onClick={handleDiscard} disabled={!hasUnsavedChanges}>
      Отменить
    </button>
  );
});

DiscardButton.displayName = 'DiscardButton';

export default DiscardButton;
