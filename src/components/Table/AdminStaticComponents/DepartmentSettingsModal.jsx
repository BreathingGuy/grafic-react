import { useState, useCallback } from 'react';
import { useAdminStore } from '../../../store/admin';
import { useMetaStore } from '../../../store/metaStore';
import { usePostWebStore } from '../../../store/postWebStore';
import EmployeesTab from './Settings/EmployeesTab/EmployeesTab';
import StatusesTab from './Settings/StatusesTab/StatusesTab';
import DepartmentTab from './Settings/DepartmentTab/DepartmentTab';
import s from './Modal.module.css';

/**
 * DepartmentSettingsModal — модальное окно настроек отдела
 * Держит черновик всех данных. Сохранение — только по кнопке "Сохранить".
 */
export default function DepartmentSettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('employees');

  // Снимки из stores (инициализируются при mount = при открытии модалки)
  // Object.is предотвращает ререндер при изменении других полей стора
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);
  const storeEmployeeById = useAdminStore(s => s.employeeById, Object.is);
  const storeEmployeeIds = useAdminStore(s => s.employeeIds, Object.is);
  const currentConfig = useMetaStore(s => s.currentDepartmentConfig);
  const departmentsList = useMetaStore(s => s.departmentsList, Object.is);

  // Draft state
  const [draftEmployeeById, setDraftEmployeeById] = useState({});
  const [draftEmployeeIds, setDraftEmployeeIds] = useState([]);
  const [draftStatuses, setDraftStatuses] = useState([]);
  const [draftName, setDraftName] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Инициализация при открытии (isOpen переключился на true)
  if (isOpen && !initialized) {
    setDraftEmployeeById({ ...storeEmployeeById });
    setDraftEmployeeIds([...storeEmployeeIds]);
    setDraftStatuses(currentConfig?.statusConfig ? currentConfig.statusConfig.map(s => ({ ...s })) : []);
    const dept = departmentsList.find(d => d.id === editingDepartmentId);
    setDraftName(dept?.name || '');
    setInitialized(true);
  }
  if (!isOpen && initialized) {
    setInitialized(false);
  }

  // === Employees draft callbacks ===
  const updateEmployee = useCallback((empId, editForm) => {
    setDraftEmployeeById(prev => ({
      ...prev,
      [empId]: { ...prev[empId], name: editForm.name, fullName: editForm.fullName, position: editForm.position }
    }));
  }, []);

  const addEmployee = useCallback((form) => {
    if (!form.id || !form.fullName) return;
    if (draftEmployeeById[form.id]) {
      alert('Сотрудник с таким ID уже существует');
      return;
    }
    setDraftEmployeeById(prev => ({
      ...prev,
      [form.id]: { id: form.id, name: form.name || form.fullName, fullName: form.fullName, position: form.position }
    }));
    setDraftEmployeeIds(prev => [...prev, form.id]);
  }, [draftEmployeeById]);

  const deleteEmployee = useCallback((empId) => {
    setDraftEmployeeById(prev => {
      const next = { ...prev };
      delete next[empId];
      return next;
    });
    setDraftEmployeeIds(prev => prev.filter(id => id !== empId));
  }, []);

  // === Сохранить всё ===
  const handleSave = useCallback(() => {
    if (!editingDepartmentId) return;

    // 1. Сотрудники → store + localStorage
    useAdminStore.setState({
      employeeById: draftEmployeeById,
      employeeIds: draftEmployeeIds
    });
    usePostWebStore.getState().updateEmployees(editingDepartmentId, {
      employeeById: draftEmployeeById,
      employeeIds: draftEmployeeIds
    });

    // 2. Обозначения → metaStore + localStorage
    const newConfig = {
      ...currentConfig,
      statusConfig: draftStatuses,
      name: draftName.trim()
    };
    const colorMap = useMetaStore.getState().buildColorMap(newConfig);
    useMetaStore.setState({ currentDepartmentConfig: newConfig, statusColorMap: colorMap });
    usePostWebStore.getState().saveDepartmentConfig(editingDepartmentId, newConfig);

    // 3. Имя отдела → departmentsList + localStorage
    const updatedList = departmentsList.map(d =>
      d.id === editingDepartmentId ? { ...d, name: draftName.trim() } : d
    );
    useMetaStore.setState({ departmentsList: updatedList });
    usePostWebStore.getState().updateDepartmentName(editingDepartmentId, draftName.trim());

    onClose();
  }, [editingDepartmentId, draftEmployeeById, draftEmployeeIds, draftStatuses, draftName, currentConfig, departmentsList, onClose]);

  if (!isOpen) return null;

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={`${s.modal} ${s.modalWide}`} onClick={e => e.stopPropagation()}>
        <div className={s.header}>
          <h3 className={s.headerTitle}>Настройки отдела</h3>
          <button onClick={onClose} className={s.closeButton}>&times;</button>
        </div>

        <div className={s.tabs}>
          <button
            className={activeTab === 'employees' ? s.tabActive : s.tab}
            onClick={() => setActiveTab('employees')}
          >
            Сотрудники
          </button>
          <button
            className={activeTab === 'statuses' ? s.tabActive : s.tab}
            onClick={() => setActiveTab('statuses')}
          >
            Обозначения
          </button>
          <button
            className={activeTab === 'department' ? s.tabActive : s.tab}
            onClick={() => setActiveTab('department')}
          >
            Отдел
          </button>
        </div>

        <div className={s.content}>
          {activeTab === 'employees' && (
            <EmployeesTab
              employeeById={draftEmployeeById}
              employeeIds={draftEmployeeIds}
              onSave={updateEmployee}
              onAdd={addEmployee}
              onDelete={deleteEmployee}
            />
          )}
          {activeTab === 'statuses' && (
            <StatusesTab
              statuses={draftStatuses}
              onChange={setDraftStatuses}
            />
          )}
          {activeTab === 'department' && (
            <DepartmentTab
              name={draftName}
              onNameChange={setDraftName}
            />
          )}
        </div>

        <div className={s.footer}>
          <button onClick={handleSave} className={s.saveBtn}>Сохранить</button>
          <button onClick={onClose} className={s.cancelBtn}>Отмена</button>
        </div>
      </div>
    </div>
  );
}