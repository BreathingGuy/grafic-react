import { useAdminStore } from '../../store/adminStore';
import styles from './AdminControls.module.css';

export default function AdminControls() {
  const editMode = useAdminStore(state => state.editMode);
  const hasUnsavedChanges = useAdminStore(state => state.hasUnsavedChanges);
  const enableEditMode = useAdminStore(state => state.enableEditMode);
  const disableEditMode = useAdminStore(state => state.disableEditMode);
  const saveDraft = useAdminStore(state => state.saveDraft);
  const publishDraft = useAdminStore(state => state.publishDraft);

  const handleEnableEditMode = () => {
    // Пока без departmentId, просто включаем режим
    enableEditMode('dept-1');
  };

  const handleSaveDraft = () => {
    saveDraft('dept-1');
    alert('Черновик сохранён');
  };

  const handlePublish = () => {
    if (window.confirm('Опубликовать изменения? Они будут видны всем пользователям.')) {
      publishDraft('dept-1');
      alert('Изменения опубликованы');
    }
  };

  return (
    <div className={styles.controlsContainer}>
      {!editMode ? (
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleEnableEditMode}
        >
          Режим Администратора
        </button>
      ) : (
        <div className={styles.editControls}>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={disableEditMode}
          >
            Выход из режима редактирования
          </button>

          <button
            className={`${styles.btn} ${styles.btnSuccess}`}
            onClick={handleSaveDraft}
            disabled={!hasUnsavedChanges}
          >
            Сохранить Черновик
          </button>

          <button
            className={`${styles.btn} ${styles.btnWarning}`}
            onClick={handlePublish}
            disabled={!hasUnsavedChanges}
          >
            Опубликовать
          </button>

          {hasUnsavedChanges && (
            <span className={styles.unsavedLabel}>
              Есть несохранённые изменения
            </span>
          )}
        </div>
      )}
    </div>
  );
}
