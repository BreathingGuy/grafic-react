import { useState } from 'react';
import { DepartmentSelector } from '../Selectors/DepartmentSelector';
import AdminConsole from '../Table/AdminConsole';
import CreateDepartmentModal from '../CreateDepartment/CreateDepartmentModal';
import { useAdminStore } from '../../store/adminStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { usePostWebStore } from '../../store/postWebStore';
import { useMetaStore } from '../../store/metaStore';
import { useFetchWebStore } from '../../store/fetchWebStore';

/**
 * AdminView - Режим редактирования расписания
 * Изолированный компонент для админского интерфейса
 */
export default function AdminView() {
  const currentDepartmentId = useWorkspaceStore(state => state.currentDepartmentId);
  const departmentsList = useMetaStore(state => state.departmentsList);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const handleExitAdminMode = () => {
    useAdminStore.getState().setAdminMode(false);
  };

  const handleCreateDepartment = async (departmentData) => {
    try {
      const postStore = usePostWebStore.getState();
      await postStore.createDepartment(departmentData);

      // Обновить список отделов
      const metaStore = useMetaStore.getState();
      await metaStore.loadDepartmentsList();

      // Переключиться на новый отдел и загрузить его данные
      const workspaceStore = useWorkspaceStore.getState();
      await workspaceStore.setDepartment(departmentData.departmentId);

      alert(`Отдел "${departmentData.departmentName}" успешно создан!`);
      setIsCreateModalOpen(false);
    } catch (error) {
      alert(`Ошибка создания отдела: ${error.message}`);
    }
  };

  const handleEditDepartment = async () => {
    if (!currentDepartmentId) {
      alert('Выберите отдел для редактирования');
      return;
    }

    try {
      const fetchStore = useFetchWebStore.getState();

      // Загружаем данные отдела
      const [employeesData, config] = await Promise.all([
        fetchStore.fetchDepartmentEmployees(currentDepartmentId),
        fetchStore.fetchDepartmentConfig(currentDepartmentId)
      ]);

      // Преобразуем данные сотрудников в формат для редактора
      const employees = employeesData.employeeIds.map(empId => {
        const emp = employeesData.employeeById[empId];
        const fullNameParts = emp.fullName.split(' ');
        return {
          id: Number(empId),
          family: fullNameParts[0] || '',
          name1: fullNameParts[1] || '',
          name2: fullNameParts[2] || '',
          position: emp.position || ''
        };
      });

      // Находим название отдела
      const dept = departmentsList.find(d => d.id === currentDepartmentId);

      // Преобразуем старый формат конфига в новый
      const normalizedStatusConfig = (config.statusConfig || []).map(status => {
        // Старый формат: { code, label, color, descriptin }
        // Новый формат: { codeList, codeWork, label, colorBackground, colorText, description }
        if (status.codeList && status.codeWork) {
          // Уже новый формат
          return status;
        } else {
          // Старый формат - преобразуем
          return {
            codeList: status.code || '',
            codeWork: status.code?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'unknown',
            label: status.label || '',
            colorBackground: status.color || '#ffffff',
            colorText: '#000000',
            description: status.descriptin || status.description || ''
          };
        }
      });

      setEditData({
        departmentId: currentDepartmentId,
        departmentName: dept?.name || config.name || '',
        employees,
        statusConfig: normalizedStatusConfig
      });

      setIsEditModalOpen(true);
    } catch (error) {
      alert(`Ошибка загрузки данных: ${error.message}`);
    }
  };

  const handleUpdateDepartment = async (departmentData) => {
    try {
      const postStore = usePostWebStore.getState();
      await postStore.updateDepartment(departmentData);

      // Обновить список отделов
      const metaStore = useMetaStore.getState();
      await metaStore.loadDepartmentsList();

      // Обновить конфигурацию
      await metaStore.loadDepartmentConfig(currentDepartmentId);

      // Перезагрузить draft с новыми данными сотрудников
      const adminStore = useAdminStore.getState();
      const editingYear = adminStore.editingYear;

      if (editingYear) {
        console.log(`🔄 Перезагрузка draft после обновления настроек отдела`);
        await adminStore.setEditingContext(currentDepartmentId, editingYear);
      }

      alert(`Настройки отдела "${departmentData.departmentName}" успешно обновлены!`);
      setIsEditModalOpen(false);
      setEditData(null);
    } catch (error) {
      alert(`Ошибка обновления отдела: ${error.message}`);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
        <DepartmentSelector />

        {currentDepartmentId && (
          <button
            onClick={handleEditDepartment}
            style={{
              padding: '6px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            ⚙️ Настройки отдела
          </button>
        )}

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

      <CreateDepartmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditData(null);
        }}
        onSave={handleUpdateDepartment}
        editMode={true}
        initialData={editData}
      />
    </>
  );
}
