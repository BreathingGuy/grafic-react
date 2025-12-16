import { memo } from 'react';
import { useScheduleStore } from '../../../store/scheduleStore';

const EmployeeNameCell = memo(({ empId }) => {
    const Emp = useScheduleStore(state => state.employeeById[empId]);

    return (
        <tr key={empId}>
            <td title={Emp.fullName}>
                {Emp.name}
            </td>
        </tr>
    );

}, (prevProps, nextProps) => {
    return prevProps.empId === nextProps.empId;
});

EmployeeNameCell.displayName = 'EmployeeRowName';

export default EmployeeNameCell;