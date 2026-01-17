import { DepartmentSelector } from '../Selectors/DepartmentSelector';
import AdminConsole from '../Table/AdminConsole';
import { useAdminStore } from '../../store/adminStore';
import { useWorkspaceStore } from '../../store/workspaceStore';

/**
 * AdminView - Режим редактирования расписания
 * Изолированный компонент для админского интерфейса
 */
export default function AdminView() {
  const currentDepartmentId = useWorkspaceStore(state => state.currentDepartmentId);

  const handleExitAdminMode = () => {
    useAdminStore.getState().setAdminMode(false);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
        <DepartmentSelector />

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

      {currentDepartmentId ? (
        <AdminConsole />
      ) : (
        <div className="empty-state">
          <p>Выберите отдел для редактирования расписания</p>
        </div>
      )}
    </>
  );
}
