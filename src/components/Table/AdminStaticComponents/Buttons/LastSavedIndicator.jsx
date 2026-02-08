import { memo } from 'react';
import { useAdminStore } from '../../../../store/adminStore';

/**
 * LastSavedIndicator — отображает время последнего сохранения черновика
 */
const LastSavedIndicator = memo(() => {
  const lastDraftSaved = useAdminStore(s => s.lastDraftSaved);

  if (!lastDraftSaved) return null;

  const date = new Date(lastDraftSaved);
  const formatted = date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div style={{ textAlign: 'right', fontSize: '12px', color: '#666', marginTop: '4px' }}>
      Черновик сохранен: {formatted}
    </div>
  );
});

LastSavedIndicator.displayName = 'LastSavedIndicator';

export default LastSavedIndicator;
