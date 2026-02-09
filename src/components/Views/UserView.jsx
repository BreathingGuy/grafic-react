import { memo } from 'react';
import { DepartmentSelector } from '../Selectors/DepartmentSelector';
import { PeriodSelector } from '../Selectors/PeriodSelector';
import UserTable from '../Table/UserTable';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useAdminStore } from '../../store/adminStore';

/**
 * UserToolbar — верхняя панель (селектор отдела + период + кнопка админки)
 * Изолирован в memo — не перерисовывается при изменениях в таблице
 */
const UserToolbar = memo(() => {
  const handleEnterAdminMode = () => {
    useAdminStore.getState().setAdminMode(true);
  };

  return (
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
  );
});

UserToolbar.displayName = 'UserToolbar';

/**
 * UserView - Режим просмотра расписания
 */
export default function UserView() {
  const currentDepartmentId = useWorkspaceStore(state => state.currentDepartmentId);

  return (
    <>
      <UserToolbar />

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
