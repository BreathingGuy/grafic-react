import { memo } from 'react';
import { useVersionsStore } from '../../../../store/versionsStore';
import s from '../AdminPanel.module.css';

/**
 * VersionIndicator — индикатор режима просмотра версии (только чтение)
 */
const VersionIndicator = memo(() => {
  const selectedVersion = useVersionsStore(s => s.selectedVersion);

  if (!selectedVersion) return null;

  return (
    <span className={s.versionBadge}>
      Просмотр версии (только чтение)
    </span>
  );
});

VersionIndicator.displayName = 'VersionIndicator';

export default VersionIndicator;
