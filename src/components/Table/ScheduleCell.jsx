import {useScheduleStor} from 'c:/Users/Huawei/Documents/web-grafic-react/src/components/Table/ScheduleCell.jsx'

const ScheduleCell = memo(({ employeeId, date }) => {
  // PROPS:
  // - employeeId: 10001 (примитив, не меняется)
  // - date: "2025-01-15" (примитив, не меняется)
  
  // ZUSTAND - подписка на КОНКРЕТНОЕ значение:
  const status = useScheduleStore(state => {
    const key = `${employeeId}-${date}`;
    const isAdmin = useAdminStore.getState().isAdmin;
    
    // Если админ - показываем черновик, иначе production
    if (isAdmin) {
      return state.draftSchedule[key] || '';
    }
    return state.scheduleMap[key] || '';
  });
  
  // ZUSTAND - проверка подсветки:
  const isChanged = useScheduleStore(state => 
    state.changedCells.has(`${employeeId}-${date}`)
  );
  
  // ZUSTAND - функции действий:
  const updateCell = useScheduleStore(state => state.updateCell);
  const isAdmin = useAdminStore(state => state.isAdmin);
  
  const [isEditing, setIsEditing] = useState(false);
  
  const handleClick = () => {
    if (isAdmin) setIsEditing(true);
  };
  
  return (
    <td
      onClick={handleClick}
      className={`
        ${STATUS_COLORS[status] || ''}
        ${isAdmin ? 'cursor-pointer hover:opacity-70' : ''}
        ${isChanged ? 'ring-2 ring-yellow-400' : ''}
      `}
    >
      {isEditing ? (
        <CellEditor
          value={status}
          onChange={(newStatus) => {
            updateCell(employeeId, date, newStatus);
            setIsEditing(false);
          }}
          onClose={() => setIsEditing(false)}
        />
      ) : (
        status
      )}
    </td>
  );
}, (prevProps, nextProps) => {
  // Сравниваем только примитивы (очень быстро!)
  return (
    prevProps.employeeId === nextProps.employeeId &&
    prevProps.date === nextProps.date
  );
});