import { useScheduleStore } from '../../../store/scheduleStore';

import EmployeeRow from './EmployeeRow';
import DatingComps from './DatingComps';

import styles from '../Table.module.css';


const ScrollableUserTable = () => {
    const employeeIds = useScheduleStore(state => state.employeeIds);

    return (
        <div className={styles.scrollable_container}>
          <table className={styles.scrollable_column}>
            <DatingComps/>
            <tbody>
              {/* Каждая строка = сотрудник */}
              {/* 🎯 Передаем ТОЛЬКО employee - без dates! */}
              {employeeIds.map(empId => (
                <EmployeeRow
                  key={empId}
                  empId={empId}
                />
              ))}
            </tbody>
          </table>
        </div>
    )
}

export default ScrollableUserTable;