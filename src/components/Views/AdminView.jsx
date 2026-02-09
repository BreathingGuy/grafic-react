import { memo } from 'react';
import { AdminDepartmentSelector } from '../Selectors/AdminDepartmentSelector';
import AdminConsole from '../Table/AdminConsole';
import AdminInitializer from '../Table/AdminInitializer';
import { useAdminStore } from '../../store/adminStore';
import { useWorkspaceStore } from '../../store/workspaceStore';

/**
 * AdminToolbar — верхняя панель админки (селектор отдела + кнопка выхода)
 * Изолирован в memo — не перерисовывается при выделении ячеек
 */
const AdminToolbar = memo(() => {
  const handleExitAdminMode = () => {
    useAdminStore.getState().setAdminMode(false);
  };

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
      <AdminDepartmentSelector />

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

  return (
    <>
      <AdminToolbar />

      {currentDepartmentId ? (
        <>
          <AdminInitializer currentDepartmentId={currentDepartmentId} />
          <AdminConsole />
        </>
      ) : (
        <div className="empty-state">
          <p>Выберите отдел для редактирования расписания</p>
        </div>
      )}
    </>
  );
}
