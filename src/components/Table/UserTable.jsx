import { useEffect } from 'react';

import { useDateStore } from '../../store/dateStore';

import ScrollableUserTable from './Scrollable/User/ScrollableUserTable';
import FixedEmployeeColumn from './Static/FixedEmployeeColumn'
import YearDataLoader from './UserStaticComponents/YearDataLoader';
import TableNavigation from '../Controls/TableNavigation';

import styles from '../Table/Table.module.css';

export default function UserTable({ period }) {
  const setPeriod = useDateStore(state => state.setPeriod);

  // Синхронизация периода из пропса с dateStore
  useEffect(() => {
    setPeriod(period);
  }, [period, setPeriod]);

  return (
    <div className={styles.tableContainer}>
      {/* Кнопки навигации по датам */}
      <YearDataLoader />
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