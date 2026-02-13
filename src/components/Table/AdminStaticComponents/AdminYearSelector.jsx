import YearSelect from './Buttons/YearSelect';
import CreateYearButton from './Buttons/CreateYearButton';
import VersionSelect from './Buttons/VersionSelect';
import VersionIndicator from './Buttons/VersionIndicator';

/**
 * AdminYearSelector — выбор года и версии для админа
 * Композиция из изолированных компонентов с минимальными подписками
 */
export default function AdminYearSelector({ onOpenYearSettings }) {
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <YearSelect />
      <CreateYearButton />
      <button
        onClick={onOpenYearSettings}
        title="Настройки года (нормы часов)"
        style={{
          padding: '4px 10px',
          backgroundColor: 'transparent',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px'
        }}
      >
        Нормы часов
      </button>
      <VersionSelect />
      <VersionIndicator />
    </div>
  );
}
