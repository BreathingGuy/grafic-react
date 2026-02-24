import YearSelect from './Buttons/YearSelect';
import CreateYearButton from './Buttons/CreateYearButton';
import VersionSelect from './Buttons/VersionSelect';
import VersionIndicator from './Buttons/VersionIndicator';
import { useHoursStore } from '../../../store/admin';
import s from './AdminPanel.module.css';

/**
 * AdminYearSelector — выбор года и версии для админа
 * Композиция из изолированных компонентов с минимальными подписками
 */
export default function AdminYearSelector({ onOpenYearSettings }) {
  const showQuarterSummary = useHoursStore(state => state.showQuarterSummary);
  const toggleQuarterSummary = useHoursStore(state => state.toggleQuarterSummary);

  return (
    <div className={s.yearSelectorRow}>
      <YearSelect />
      <CreateYearButton />
      <button
        onClick={onOpenYearSettings}
        title="Настройки года (нормы часов)"
        className={s.normsButton}
      >
        Нормы часов
      </button>
      <label className={s.checkboxLabel}>
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
