import AdminMonthHeaders from './AdminMonthHeaders';
import AdminDaySlots from './AdminDaySlots';


const AdminDatingComps = ({tableId}) => {

    return (
        <thead>
            <AdminMonthHeaders tableId={tableId} />
            <AdminDaySlots tableId={tableId}/>
        </thead>
    )
}

export default AdminDatingComps;