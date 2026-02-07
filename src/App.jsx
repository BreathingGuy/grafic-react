import { useEffect, useState } from 'react';

import { useMetaStore } from './store/metaStore';
import { useDateStore } from './store/dateStore';
import { useAdminStore } from './store/adminStore';
import { isInitialized, initializeLocalStorage } from './services/localStorageInit';

import UserView from './components/Views/UserView';
import AdminView from './components/Views/AdminView';

/**
 * Main - корневой компонент приложения
 * Переключатель между режимами просмотра и редактирования
 */
function Main() {
  const [storageReady, setStorageReady] = useState(false);
  const isAdminMode = useAdminStore(state => state.isAdminMode);

  useEffect(() => {
    const initApp = async () => {
      console.log('🟢 App initialization started');

      // Проверяем и инициализируем localStorage
      if (!isInitialized()) {
        console.log('📦 localStorage не инициализирован, загружаем данные...');
        try {
          await initializeLocalStorage();
          console.log('✅ localStorage инициализирован');
        } catch (error) {
          console.error('❌ Ошибка инициализации localStorage:', error);
        }
      } else {
        console.log('✅ localStorage уже инициализирован');
      }

      setStorageReady(true);

      // Инициализируем dateStore (вычислить начальный диапазон дат)
      useDateStore.getState().initialize();
      console.log('📅 DateStore initialized');

      // Загружаем список отделов
      useMetaStore.getState().loadDepartmentsList();
      console.log('🏢 Departments list loading...');
    };

    initApp();
  }, []);

  // Показываем загрузку пока инициализируется storage
  if (!storageReady) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Загрузка данных...</h2>
        <p>Инициализация localStorage...</p>
      </div>
    );
  }

  // Простой переключатель между режимами
  return isAdminMode ? <AdminView /> : <UserView />;
}

export default function App() {
  return <Main />;
}
