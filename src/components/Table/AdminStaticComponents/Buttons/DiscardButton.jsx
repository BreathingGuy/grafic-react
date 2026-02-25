import { memo } from 'react';
import { useAdminStore } from '../../../../store/admin';
import { useClipboardStore } from '../../../../store/selection';
import s from '../AdminPanel.module.css';

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
    <button onClick={handleDiscard} disabled={!hasUnsavedChanges} className={s.actionBtn}>
      Отменить
    </button>
  );
});

DiscardButton.displayName = 'DiscardButton';

export default DiscardButton;
