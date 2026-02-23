import { useEffect, memo } from 'react';

import { useDateUserStore } from '../../../store/dateUserStore';
import { useWorkspaceStore } from '../../../store/workspaceStore';

const YearDataLoader = memo(() => {
  const currentYear = useDateUserStore(state => state.currentYear);
  const loadYearData = useWorkspaceStore(state => state.loadYearData);

  useEffect(() => {
    loadYearData(currentYear);
  }, [currentYear, loadYearData]);

  return null;
});

export default YearDataLoader;