import { memo, useState } from 'react';
import { AdminDepartmentSelector } from '../Selectors/AdminDepartmentSelector';
import AdminConsole from '../Table/AdminConsole';
import AdminInitializer from '../Table/AdminInitializer';
import DepartmentSettingsModal from '../Table/AdminStaticComponents/DepartmentSettingsModal';
import { useAdminStore } from '../../store/adminStore';
import { useWorkspaceStore } from '../../store/workspaceStore';

/**
 * AdminToolbar — верхняя панель админки (селектор отдела + кнопка выхода + настройки)
 * Изолирован в memo — не перерисовывается при выделении ячеек
 */
const AdminToolbar = memo(({ onOpenSettings }) => {
  const currentDepartmentId = useWorkspaceStore(state => state.currentDepartmentId);

  const handleExitAdminMode = () => {
    useAdminStore.getState().setAdminMode(false);
  };

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
      <AdminDepartmentSelector />

      {currentDepartmentId && (
        <button
          onClick={onOpenSettings}
          title="Настройки отдела"
          style={{
            padding: '6px 10px',
            backgroundColor: 'transparent',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1
          }}
        >
          &#9881;
        </button>
      )}

      <button
        onClick={handleExitAdminMode}
        style={{
          padding: '6px 16px',
          backgroundColor: '#d32f2f',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 500
        }}
      >
        Выйти из админки
      </button>
    </div>
  );
});

AdminToolbar.displayName = 'AdminToolbar';

/**
 * AdminView - Режим редактирования расписания
 */
export default function AdminView() {
  const currentDepartmentId = useWorkspaceStore(state => state.currentDepartmentId);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <AdminToolbar onOpenSettings={() => setSettingsOpen(true)} />

      {currentDepartmentId ? (
        <>
          <AdminInitializer currentDepartmentId={currentDepartmentId} />
          <AdminConsole />
          <DepartmentSettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />
        </>
      ) : (
        <div className="empty-state">
          <p>Выберите отдел для редактирования расписания</p>
        </div>
      )}
    </>
  );
}
