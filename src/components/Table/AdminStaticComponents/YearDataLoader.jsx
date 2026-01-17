import { useEffect, memo } from 'react';

import { useDateStore } from '../../../store/dateAdminStore';
import { useWorkspaceStore } from '../../../store/workspaceStore';

const YearDataLoader = memo(() => {
  const currentYear = useDateStore(state => state.currentYear);
  const loadYearData = useWorkspaceStore(state => state.loadYearData);

  useEffect(() => {
    loadYearData(currentYear);
  }, [currentYear, loadYearData]);

  return null;
});

export default YearDataLoader;