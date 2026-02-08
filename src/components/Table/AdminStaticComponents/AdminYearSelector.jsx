import YearSelect from './Buttons/YearSelect';
import CreateYearButton from './Buttons/CreateYearButton';
import VersionSelect from './Buttons/VersionSelect';
import VersionIndicator from './Buttons/VersionIndicator';

/**
 * AdminYearSelector — выбор года и версии для админа
 * Композиция из изолированных компонентов с минимальными подписками
 */
export default function AdminYearSelector() {
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <YearSelect />
      <CreateYearButton />
      <VersionSelect />
      <VersionIndicator />
    </div>
  );
}
