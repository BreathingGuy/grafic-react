import { memo, useEffect } from 'react';
import { useAdminStore } from '../../../../store/adminStore';
import { useVersionsStore } from '../../../../store/versionsStore';

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
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ fontWeight: 500 }}>Версия:</label>
      <select
        value={selectedVersion || ''}
        onChange={handleVersionChange}
        disabled={loadingVersions}
        style={{
          padding: '6px 12px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          fontSize: '14px',
          minWidth: '140px',
          backgroundColor: selectedVersion ? '#fff3cd' : 'white'
        }}
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
