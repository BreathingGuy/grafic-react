import {DepartmentSelector} from './components/Tabs/DepartmentTabs'
import ScheduleTable from './components/Table/ScheduleTable'

import { useEffect, useState } from 'react';

import {useMetaStore} from './store/metaStore'
import {useWorkspaceStore} from './store/workspaceStore'
import {useDateStore} from './store/dateStore'


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

      {currentDepartmentId ? (
        <ScheduleTable period={'3months'} />
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
