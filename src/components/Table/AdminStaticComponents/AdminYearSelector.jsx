import { useState, useRef, useEffect } from 'react';
import YearSelect from './Buttons/YearSelect';
import CreateYearButton from './Buttons/CreateYearButton';
import VersionSelect from './Buttons/VersionSelect';
import VersionIndicator from './Buttons/VersionIndicator';
import DiscardButton from './Buttons/DiscardButton';
import SaveDraftButton from './Buttons/SaveDraftButton';
import PublishButton from './Buttons/PublishButton';
import LastSavedIndicator from './Buttons/LastSavedIndicator';
import { useHoursStore } from '../../../store/admin';
import s from './AdminPanel.module.css';

/**
 * AdminYearSelector — выбор года, версии и кнопки управления
 */
export default function AdminYearSelector({ onOpenYearSettings }) {
  const showQuarterSummary = useHoursStore(state => state.showQuarterSummary);
  const toggleQuarterSummary = useHoursStore(state => state.toggleQuarterSummary);

  const [viewOpen, setViewOpen] = useState(false);
  const viewRef = useRef(null);

  useEffect(() => {
    if (!viewOpen) return;
    const handler = (e) => {
      if (viewRef.current && !viewRef.current.contains(e.target)) {
        setViewOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [viewOpen]);

  return (
    <div className={s.yearSelectorRow}>
      <YearSelect />
      <VersionSelect />
      <VersionIndicator />
      <CreateYearButton />
      <button
        onClick={onOpenYearSettings}
        className={s.controlBtn}
      >
        Настройки года
      </button>
      <div className={s.viewWrapper} ref={viewRef}>
        <button
          className={s.controlBtn}
          onClick={() => setViewOpen(v => !v)}
        >
          Вид {viewOpen ? '▲' : '▼'}
        </button>
        {viewOpen && (
          <div className={s.viewMenu}>
            <label className={s.viewMenuItem}>
              <input
                type="checkbox"
                checked={showQuarterSummary}
                onChange={toggleQuarterSummary}
              />
              Итоги кварталов
            </label>
          </div>
        )}
      </div>

      <div className={s.actionGroup}>
        <LastSavedIndicator />
        <DiscardButton />
        <SaveDraftButton />
        <PublishButton />
      </div>
    </div>
  );
}
