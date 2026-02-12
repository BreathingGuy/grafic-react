import { useState } from 'react';
import { useAdminStore } from '../../../../store/adminStore';
import { useMetaStore } from '../../../../store/metaStore';
import { usePostWebStore } from '../../../../store/postWebStore';
import { inputStyle, smallBtnStyle } from './settingsStyles';

export default function DepartmentTab() {
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);
  const departmentsList = useMetaStore(s => s.departmentsList);
  const currentConfig = useMetaStore(s => s.currentDepartmentConfig);

  const currentDept = departmentsList.find(d => d.id === editingDepartmentId);
  const [name, setName] = useState(currentDept?.name || '');

  const saveName = async () => {
    if (!name.trim() || !editingDepartmentId) return;

    await usePostWebStore.getState().updateDepartmentName(editingDepartmentId, name.trim());

    const updatedList = departmentsList.map(d =>
      d.id === editingDepartmentId ? { ...d, name: name.trim() } : d
    );
    useMetaStore.setState({ departmentsList: updatedList });

    if (currentConfig) {
      const updatedConfig = { ...currentConfig, name: name.trim() };
      useMetaStore.setState({ currentDepartmentConfig: updatedConfig });
      await usePostWebStore.getState().saveDepartmentConfig(editingDepartmentId, updatedConfig);
    }

    alert('Имя отдела сохранено');
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: 500, marginBottom: '4px' }}>
          ID отдела
        </label>
        <input value={editingDepartmentId || ''} disabled style={{ ...inputStyle, backgroundColor: '#f5f5f5' }} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: 500, marginBottom: '4px' }}>
          Название отдела
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ ...inputStyle, width: '300px' }}
        />
      </div>
      <button onClick={saveName} style={smallBtnStyle}>
        Сохранить
      </button>
    </div>
  );
}
