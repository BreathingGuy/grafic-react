import { memo, useState } from 'react';
import { AdminDepartmentSelector } from '../Selectors/AdminDepartmentSelector';
import AdminConsole from '../Table/AdminConsole';
import AdminInitializer from '../Table/AdminInitializer';
import DepartmentSettingsModal from '../Table/AdminStaticComponents/DepartmentSettingsModal';
import { useAdminAuthStore } from '../../store/admin';
import { useWorkspaceStore } from '../../store/workspaceStore';
import s from './Toolbar.module.css';

/**
 * AdminToolbar — верхняя панель админки (селектор отдела + кнопка выхода + настройки)
 * Изолирован в memo — не перерисовывается при выделении ячеек
 */
const AdminToolbar = memo(({ onOpenSettings }) => {
  const currentDepartmentId = useWorkspaceStore(state => state.currentDepartmentId);

  const handleExitAdminMode = () => {
    useAdminAuthStore.getState().setAdminMode(false);
  };

  return (
    <div className={s.toolbar}>
      <AdminDepartmentSelector />

      {currentDepartmentId && (
        <button
          onClick={onOpenSettings}
          title="Настройки отдела"
          className={s.settingsBtn}
        >
          &#9881;
        </button>
      )}

      <button
        onClick={handleExitAdminMode}
        className={s.exitBtn}
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
