import { useEffect } from 'react';

import {useMetaStore} from './store/metaStore'
import {useWorkspaceStore} from './store/workspaceStore'
import {useDateStore} from './store/dateStore'

import {DepartmentSelector} from './components/Selectors/DepartmentSelector'
import {PeriodSelector} from './components/Selectors/PeriodSelector'
import UserTable from './components/Table/UserTable'


function Main() {
  const currentDepartmentId = useWorkspaceStore(state => state.currentDepartmentId);
  
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
      <DepartmentSelector />
      <PeriodSelector />

      {currentDepartmentId ? (
        <UserTable period={'3months'} />
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
