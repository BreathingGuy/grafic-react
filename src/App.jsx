import {DepartmentSelector} from './components/Tabs/DepartmentTabs'

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
    <DepartmentSelector />
  );
}

export default function App() {
  return (
      <Main />
  );
}
