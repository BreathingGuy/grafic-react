import { useEffect } from 'react';

import {useMetaStore} from './store/metaStore'
import {useWorkspaceStore} from './store/workspaceStore'
import {useDateStore} from './store/dateStore'
import {useAdminStore} from './store/adminStore'

import {DepartmentSelector} from './components/Selectors/DepartmentSelector'
import {PeriodSelector} from './components/Selectors/PeriodSelector'
import ScheduleTable from './components/Table/ScheduleTable'
import AdminControls from './components/Admin/AdminControls'
import AdminScheduleTable from './components/Admin/AdminScheduleTable'


function Main() {
  const currentDepartmentId = useWorkspaceStore(state => state.currentDepartmentId);
  const editMode = useAdminStore(state => state.editMode);

  useEffect(() => {
    console.log('🟢 App initialization started');

    // Инициализируем dateStore (вычислить начальный диапазон дат)
    useDateStore.getState().initialize();
    console.log('📅 DateStore initialized');

    // Загружаем список отделов
    useMetaStore.getState().loadDepartmentsList();
    console.log('🏢 Departments list loading...');

  }, []);

  return (
    <>
      <AdminControls />
      <DepartmentSelector />
      {!editMode && <PeriodSelector />}

      {currentDepartmentId ? (
        editMode ? (
          <AdminScheduleTable />
        ) : (
          <ScheduleTable period={'3months'} />
        )
      ) : (
        <div className="empty-state">
          <p>Выберите отдел для просмотра расписания</p>
        </div>
      )}
    </>
  );
}

export default function App() {
  return <Main />;
}
