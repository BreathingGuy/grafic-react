import { useEffect } from 'react';
// import { useScheduleStore } from '../../store/scheduleStore';
import { useDateStore } from '../../store/dateStore';
import { useWorkspaceStore } from '../../store/workspaceStore';

import ScrollableUserTable from './Scrollable/User/ScrollableUserTable';
import FixedEmployeeColumn from './Static/FixedEmployeeColumn'
import TableNavigation from '../Controls/TableNavigation';

import styles from '../Table/Table.module.css';

export default function UserTable({ period }) {
  // const loading = useScheduleStore(state => state.loading);
  const currentYear = useDateStore(state => state.currentYear);
  const setPeriod = useDateStore(state => state.setPeriod);
  // Workspace store для загрузки данных при смене года
  const loadYearData = useWorkspaceStore(state => state.loadYearData);

  // Синхронизация периода из пропса с dateStore
  useEffect(() => {
    setPeriod(period);
  }, [period, setPeriod]);

  // Загрузка данных при смене года
  useEffect(() => {
    loadYearData(currentYear);
  }, [currentYear, loadYearData]);


  return (
    <div className={styles.tableContainer}>
      {/* Кнопки навигации по датам */}
      <TableNavigation />

      <div className={styles.container}>
        {/* ЛЕВАЯ ФИКСИРОВАННАЯ КОЛОНКА - имена сотрудников */}
        <FixedEmployeeColumn />
        {/* ПРАВАЯ НЕФИКСИРОВАННАЯ КОЛОНКА - график */}
        <ScrollableUserTable />
      </div>
    </div>
  );
}