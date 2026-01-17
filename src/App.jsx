import { useEffect } from 'react';

import { useMetaStore } from './store/metaStore';
import { useDateStore } from './store/dateStore';
import { useAdminStore } from './store/adminStore';

import UserView from './components/Views/UserView';
import AdminView from './components/Views/AdminView';

/**
 * Main - корневой компонент приложения
 * Переключатель между режимами просмотра и редактирования
 */
function Main() {
  const isAdminMode = useAdminStore(state => state.isAdminMode);

  useEffect(() => {
    console.log('🟢 App initialization started');

    // Инициализируем dateStore (вычислить начальный диапазон дат)
    useDateStore.getState().initialize();
    console.log('📅 DateStore initialized');

    // Загружаем список отделов
    useMetaStore.getState().loadDepartmentsList();
    console.log('🏢 Departments list loading...');
  }, []);

  // Простой переключатель между режимами
  return isAdminMode ? <AdminView /> : <UserView />;
}

export default function App() {
  return <Main />;
}
