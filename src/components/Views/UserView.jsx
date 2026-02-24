import { memo } from 'react';
import { DepartmentSelector } from '../Selectors/DepartmentSelector';
import { PeriodSelector } from '../Selectors/PeriodSelector';
import UserTable from '../Table/UserTable';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useAdminAuthStore } from '../../store/admin';
import s from './Toolbar.module.css';

/**
 * UserToolbar — верхняя панель (селектор отдела + период + кнопка админки)
 * Изолирован в memo — не перерисовывается при изменениях в таблице
 */
const UserToolbar = memo(() => {
  const handleEnterAdminMode = () => {
    useAdminAuthStore.getState().setAdminMode(true);
  };

  return (
    <div className={s.toolbar}>
      <DepartmentSelector />
      <PeriodSelector />

      <button
        onClick={handleEnterAdminMode}
        className={s.adminModeBtn}
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
