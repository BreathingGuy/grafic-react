import { DepartmentSelector } from '../Selectors/DepartmentSelector';
import { PeriodSelector } from '../Selectors/PeriodSelector';
import UserTable from '../Table/UserTable';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useAdminStore } from '../../store/adminStore';

/**
 * UserView - Режим просмотра расписания
 * Изолированный компонент для пользовательского интерфейса
 */
export default function UserView() {
  const currentDepartmentId = useWorkspaceStore(state => state.currentDepartmentId);

  const handleEnterAdminMode = () => {
    useAdminStore.getState().setAdminMode(true);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
        <DepartmentSelector />
        <PeriodSelector />

        <button
          onClick={handleEnterAdminMode}
          style={{
            padding: '6px 16px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Режим админа
        </button>
      </div>

      {currentDepartmentId ? (
        <UserTable period={'1year'} />
      ) : (
        <div className="empty-state">
          <p>Выберите отдел для просмотра расписания</p>
        </div>
      )}
    </>
  );
}
