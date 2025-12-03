const EmployeeRow = memo(({ employee, dates }) => {
  // PROPS:
  // - employee: {id: 10001, name: "Иванов И.И.", department: "Отдел А"}
  // - dates: ["2025-01-15", "2025-01-16", ...]
  
  return (
    <tr>
      {/* Фиксированная колонка с именем */}
      <EmployeeNameCell 
        name={employee.name}          
        nameLong={employee.name_long} 
      />
      
      {/* Прокручиваемые ячейки с датами */}
      {dates.map(date => (
        <ScheduleCell
          key={date}
          employeeId={employee.id} 
          date={date}               
        />
      ))}
    </tr>
  );
}, (prevProps, nextProps) => {
  // Сравниваем по ссылке (быстро!)
  return (
    prevProps.employee === nextProps.employee &&
    prevProps.dates === nextProps.dates
  );
});