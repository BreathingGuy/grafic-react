import {DepartmentSelector} from './components/Tabs/DepartmentTabs'
import ScheduleTable from './components/Table/ScheduleTable'

import { useEffect } from 'react';

import {useMetaStore} from './store/metaStore'

function Main() {
  useEffect(() => {
    console.log('🟢 useEffect triggered');
    
    console.log('🟡 fetchData started');
    useMetaStore.getState().loadDepartmentsList();
    console.log('🟡 fetchData finished');

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
