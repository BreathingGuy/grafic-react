import { memo } from 'react';
import { useVersionsStore } from '../../../../store/versionsStore';

/**
 * VersionIndicator — индикатор режима просмотра версии (только чтение)
 */
const VersionIndicator = memo(() => {
  const selectedVersion = useVersionsStore(s => s.selectedVersion);

  if (!selectedVersion) return null;

  return (
    <span style={{
      padding: '4px 8px',
      backgroundColor: '#fff3cd',
      borderRadius: '4px',
      fontSize: '12px',
      color: '#856404'
    }}>
      Просмотр версии (только чтение)
    </span>
  );
});

VersionIndicator.displayName = 'VersionIndicator';

export default VersionIndicator;
