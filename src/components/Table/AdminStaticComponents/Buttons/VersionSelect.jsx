import { memo, useEffect } from 'react';
import { useAdminStore } from '../../../../store/admin';
import { useVersionsStore } from '../../../../store/versionsStore';
import s from '../AdminPanel.module.css';

/**
 * VersionSelect — выпадающий список версий
 * Загружает версии при смене года, позволяет просматривать снапшоты
 */
const VersionSelect = memo(() => {
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);
  const editingYear = useAdminStore(s => s.editingYear);

  const selectedVersion = useVersionsStore(s => s.selectedVersion);
  const loadingVersions = useVersionsStore(s => s.loadingVersions);
  const yearVersions = useVersionsStore(s => s.yearVersions);

  useEffect(() => {
    if (editingDepartmentId && editingYear) {
      useVersionsStore.getState().loadYearVersions(editingDepartmentId, editingYear);
    }
  }, [editingDepartmentId, editingYear]);

  const handleVersionChange = async (e) => {
    const version = e.target.value;

    if (version === '') {
      await useAdminStore.getState().exitVersionView();
    } else {
      await useAdminStore.getState().loadVersion(version);
    }
  };

  return (
    <div className={s.selectGroup}>
      <label className={s.selectLabel}>Версия:</label>
      <select
        value={selectedVersion || ''}
        onChange={handleVersionChange}
        disabled={loadingVersions}
        className={s.selectWide}
        style={selectedVersion ? { backgroundColor: '#fff3cd' } : undefined}
      >
        <option value="">Текущий draft</option>
        {loadingVersions ? (
          <option disabled>Загрузка...</option>
        ) : (
          yearVersions.map(version => (
            <option key={version} value={version}>{version}</option>
          ))
        )}
      </select>
    </div>
  );
});

VersionSelect.displayName = 'VersionSelect';

export default VersionSelect;
