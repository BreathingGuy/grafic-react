import { useEffect, useState } from 'react';

import {useMetaStore} from './store/metaStore'
import {useWorkspaceStore} from './store/workspaceStore'
import {useDateStore} from './store/dateStore'

import {DepartmentSelector} from './components/Selectors/DepartmentSelector'
import {PeriodSelector} from './components/Selectors/PeriodSelector'
import ScheduleTable from './components/Table/ScheduleTable'
import { AdminConsole } from './components/Admin'


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

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
        <DepartmentSelector />
        {!isAdminMode && <PeriodSelector />}

        <button
          onClick={() => setIsAdminMode(!isAdminMode)}
          style={{
            padding: '6px 16px',
            backgroundColor: isAdminMode ? '#d32f2f' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          {isAdminMode ? 'Выйти из админки' : 'Режим админа'}
        </button>
      </div>

      {currentDepartmentId ? (
        isAdminMode ? (
          <AdminConsole />
        ) : (
          <ScheduleTable period={'1year'} />
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
