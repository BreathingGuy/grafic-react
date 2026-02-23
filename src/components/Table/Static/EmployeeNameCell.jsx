import { memo } from 'react';
import { useUserStore } from '../../../store/userStore';

const EmployeeNameCell = memo(({ empId }) => {
    const Emp = useUserStore(state => state.employeeById[empId]);

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