import { memo } from "react";
import { useScheduleStore } from '../../../store/scheduleStore';

import EmployeeNameCell from './EmployeeNameCell' 

import styles from '../Table.module.css';

const FixedEmployeeColumn = memo(() => {
    const employeeIds = useScheduleStore(state => state.employeeIds);

    return (
        <table className={styles.fixed_column}>
            <thead>
                <tr>
                <th></th>
                </tr>
                <tr>
                <th></th>
                </tr>
            </thead>

            <tbody>
                {employeeIds.map(empId => (
                <EmployeeNameCell key={empId} empId={empId}/>
                ))}
            </tbody>
        </table>
    )
})

export default FixedEmployeeColumn;