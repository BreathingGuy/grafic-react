import DiscardButton from './Buttons/DiscardButton';
import SaveDraftButton from './Buttons/SaveDraftButton';
import PublishButton from './Buttons/PublishButton';
import LastSavedIndicator from './Buttons/LastSavedIndicator';
import s from './AdminPanel.module.css';

/**
 * AdminHeader - Заголовок и кнопки управления админ-консоли
 * Композиция из изолированных компонентов с минимальными подписками
 */
export default function AdminHeader() {
  return (
    <div className={s.headerContainer}>
      <div className={s.headerRow}>
        <h2 className={s.headerTitle}>Редактирование графика</h2>
        <div>
          <DiscardButton />
          <SaveDraftButton />
          <PublishButton />
        </div>
      </div>
      <LastSavedIndicator />
    </div>
  );
}
