import YearSelect from './Buttons/YearSelect';
import CreateYearButton from './Buttons/CreateYearButton';
import VersionSelect from './Buttons/VersionSelect';
import VersionIndicator from './Buttons/VersionIndicator';
import { useAdminStore } from '../../../store/adminStore';

/**
 * AdminYearSelector — выбор года и версии для админа
 * Композиция из изолированных компонентов с минимальными подписками
 */
export default function AdminYearSelector({ onOpenYearSettings }) {
  const showQuarterSummary = useAdminStore(state => state.showQuarterSummary);
  const toggleQuarterSummary = useAdminStore(state => state.toggleQuarterSummary);

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
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={showQuarterSummary}
          onChange={toggleQuarterSummary}
        />
        Итоги кварталов
      </label>
      <VersionSelect />
      <VersionIndicator />
    </div>
  );
}
