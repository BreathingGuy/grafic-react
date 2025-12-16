import { useEffect, useState } from 'react';

import {useMetaStore} from './store/metaStore'
import {useWorkspaceStore} from './store/workspaceStore'
import {useDateStore} from './store/dateStore'

import {DepartmentSelector} from './components/Selectors/DepartmentSelector'
import {PeriodSelector} from './components/Selectors/PeriodSelector'
import ScheduleTable from './components/Table/ScheduleTable'
import AdminScheduleView from './components/Admin/AdminScheduleView'


function Main() {
  const currentDepartmentId = useWorkspaceStore(state => state.currentDepartmentId);
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    console.log('🟢 App initialization started');

    // Инициализируем dateStore (вычислить начальный диапазон дат)
    useDateStore.getState().initialize();
    console.log('📅 DateStore initialized');

    // Загружаем список отделов
    useMetaStore.getState().loadDepartmentsList();
    console.log('🏢 Departments list loading...');

  }, []);

  const toggleAdminMode = () => {
    setIsAdminMode(prev => !prev);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
        <DepartmentSelector />
        {!isAdminMode && <PeriodSelector />}
        <button
          onClick={toggleAdminMode}
          style={{
            padding: '8px 16px',
            backgroundColor: isAdminMode ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isAdminMode ? 'Выход из админки' : 'Режим администратора'}
        </button>
      </div>

      {currentDepartmentId ? (
        isAdminMode ? (
          <AdminScheduleView />
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
