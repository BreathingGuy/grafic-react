import DiscardButton from './Buttons/DiscardButton';
import SaveDraftButton from './Buttons/SaveDraftButton';
import PublishButton from './Buttons/PublishButton';
import LastSavedIndicator from './Buttons/LastSavedIndicator';

/**
 * AdminHeader - Заголовок и кнопки управления админ-консоли
 * Композиция из изолированных компонентов с минимальными подписками
 */
export default function AdminHeader() {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Редактирование графика</h2>
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
