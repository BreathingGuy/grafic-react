import { useState } from 'react';
import { DepartmentSelector } from '../Selectors/DepartmentSelector';
import AdminConsole from '../Table/AdminConsole';
import CreateDepartmentModal from '../CreateDepartment/CreateDepartmentModal';
import { useAdminStore } from '../../store/adminStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { usePostWebStore } from '../../store/postWebStore';
import { useMetaStore } from '../../store/metaStore';

/**
 * AdminView - Режим редактирования расписания
 * Изолированный компонент для админского интерфейса
 */
export default function AdminView() {
  const currentDepartmentId = useWorkspaceStore(state => state.currentDepartmentId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleExitAdminMode = () => {
    useAdminStore.getState().setAdminMode(false);
  };

  const handleCreateDepartment = async (departmentData) => {
    try {
      const postStore = usePostWebStore.getState();
      await postStore.createDepartment(departmentData);

      // Обновить список отделов
      const metaStore = useMetaStore.getState();
      metaStore.loadDepartmentsList();

      alert(`Отдел "${departmentData.departmentName}" успешно создан!`);
      setIsCreateModalOpen(false);
    } catch (error) {
      alert(`Ошибка создания отдела: ${error.message}`);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
        <DepartmentSelector />

        <button
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            padding: '6px 16px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          + Создать отдел
        </button>

        <button
          onClick={handleExitAdminMode}
          style={{
            padding: '6px 16px',
            backgroundColor: '#d32f2f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Выйти из админки
        </button>
      </div>

      {currentDepartmentId ? (
        <AdminConsole />
      ) : (
        <div className="empty-state">
          <p>Выберите отдел для редактирования расписания</p>
        </div>
      )}

      <CreateDepartmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateDepartment}
      />
    </>
  );
}
