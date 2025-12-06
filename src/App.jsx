import {DepartmentSelector} from './components/Tabs/DepartmentTabs'
import ScheduleTable from './components/Table/ScheduleTable'

import { useEffect } from 'react';

import {useMetaStore} from './store/metaStore'
import {useDateStore} from './store/dateStore'

function Main() {
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
      <ScheduleTable period={'1year'}/>
    </>
  );
}

export default function App() {
  return (
      <Main />
  );
}
