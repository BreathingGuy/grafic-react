import { useState, useEffect } from 'react';
import EmployeeEditor from './EmployeeEditor';
import StatusConfigEditor from './StatusConfigEditor';
import styles from './CreateDepartmentModal.module.css';

/**
 * CreateDepartmentModal - Модальное окно для создания/редактирования отдела
 *
 * Включает:
 * - Основная информация (ID, название)
 * - Редактор списка сотрудников
 * - Редактор конфигурации статусов
 *
 * @param {boolean} editMode - режим редактирования (true) или создания (false)
 * @param {Object} initialData - начальные данные для редактирования
 */
export default function CreateDepartmentModal({ isOpen, onClose, onSave, editMode = false, initialData = null }) {
  const [departmentId, setDepartmentId] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [employees, setEmployees] = useState([
    { id: 1000, family: '', name1: '', name2: '', position: '' }
  ]);
  const [statusConfig, setStatusConfig] = useState([
    {
      codeList: 'Д',
      codeWork: 'working',
      label: 'Дневная смена',
      colorBackground: '#d4edda',
      colorText: '#155724',
      description: 'с 8 до 16.30 вечера'
    }
  ]);

  const [currentStep, setCurrentStep] = useState(1); // 1: основная информация, 2: сотрудники, 3: статусы

  // Загружаем данные при редактировании
  useEffect(() => {
    if (editMode && initialData && isOpen) {
      setDepartmentId(initialData.departmentId || '');
      setDepartmentName(initialData.departmentName || '');
      setEmployees(initialData.employees || []);
      setStatusConfig(initialData.statusConfig || []);
    } else if (!editMode && isOpen) {
      // Сброс при создании нового
      setDepartmentId('');
      setDepartmentName('');
      setEmployees([{ id: 1000, family: '', name1: '', name2: '', position: '' }]);
      setStatusConfig([
        {
          codeList: 'Д',
          codeWork: 'working',
          label: 'Дневная смена',
          colorBackground: '#d4edda',
          colorText: '#155724',
          description: 'с 8 до 16.30 вечера'
        }
      ]);
    }
  }, [editMode, initialData, isOpen]);

  const handleSubmit = async () => {
    // Валидация
    if (!departmentId.trim()) {
      alert('Введите ID отдела');
      return;
    }
    if (!departmentName.trim()) {
      alert('Введите название отдела');
      return;
    }
    if (employees.length === 0) {
      alert('Добавьте хотя бы одного сотрудника');
      return;
    }
    if (statusConfig.length === 0) {
      alert('Добавьте хотя бы один статус');
      return;
    }

    // Проверка полей сотрудников
    const hasEmptyEmployees = employees.some(emp =>
      !emp.family.trim() || !emp.name1.trim() || !emp.name2.trim()
    );
    if (hasEmptyEmployees) {
      alert('Заполните ФИО всех сотрудников');
      return;
    }

    // Проверка полей статусов
    const hasEmptyStatuses = statusConfig.some(status =>
      !status.codeList?.trim() || !status.codeWork?.trim() || !status.label?.trim()
    );
    if (hasEmptyStatuses) {
      alert('Заполните все поля статусов');
      return;
    }

    const newDepartment = {
      departmentId: departmentId.trim(),
      departmentName: departmentName.trim(),
      employees,
      statusConfig
    };

    await onSave(newDepartment);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{editMode ? 'Настройки отдела' : 'Создать новый отдел'}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          {/* Шаги */}
          <div className={styles.steps}>
            <div
              className={`${styles.step} ${currentStep === 1 ? styles.active : ''} ${currentStep > 1 ? styles.completed : ''}`}
              onClick={() => setCurrentStep(1)}
            >
              1. Основная информация
            </div>
            <div
              className={`${styles.step} ${currentStep === 2 ? styles.active : ''} ${currentStep > 2 ? styles.completed : ''}`}
              onClick={() => setCurrentStep(2)}
            >
              2. Сотрудники
            </div>
            <div
              className={`${styles.step} ${currentStep === 3 ? styles.active : ''}`}
              onClick={() => setCurrentStep(3)}
            >
              3. Статусы
            </div>
          </div>

          {/* Шаг 1: Основная информация */}
          {currentStep === 1 && (
            <div className={styles.stepContent}>
              <div className={styles.formGroup}>
                <label>ID отдела *</label>
                <input
                  type="text"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  placeholder="dept-5"
                  disabled={editMode}
                  style={editMode ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                />
                <small>{editMode ? 'ID отдела нельзя изменить' : 'Латинские буквы, цифры, дефис. Например: dept-5'}</small>
              </div>

              <div className={styles.formGroup}>
                <label>Название отдела *</label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="ПФ АС МР"
                />
              </div>
            </div>
          )}

          {/* Шаг 2: Сотрудники */}
          {currentStep === 2 && (
            <div className={styles.stepContent}>
              <EmployeeEditor
                employees={employees}
                onChange={setEmployees}
              />
            </div>
          )}

          {/* Шаг 3: Статусы */}
          {currentStep === 3 && (
            <div className={styles.stepContent}>
              <StatusConfigEditor
                statusConfig={statusConfig}
                onChange={setStatusConfig}
              />
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Отмена
          </button>

          {currentStep > 1 && (
            <button
              className={styles.backButton}
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Назад
            </button>
          )}

          {currentStep < 3 ? (
            <button
              className={styles.nextButton}
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Далее
            </button>
          ) : (
            <button className={styles.saveButton} onClick={handleSubmit}>
              {editMode ? 'Сохранить изменения' : 'Создать отдел'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
