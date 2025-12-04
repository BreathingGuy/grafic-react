import { memo } from 'react';
import ScheduleCell from './ScheduleCell';

const EmployeeRow = memo(({ employee, dates }) => {
  // === PROPS ===
  //
  // employee: объект сотрудника из employeeMap
  //   {
  //     id: "1000",
  //     name: "Смирнов А.С.",            // Короткое имя для таблицы
  //     fullName: "Смирнов Александр Сергеевич"  // Полное имя для тултипа
  //   }
  //
  // dates: массив дат в формате YYYY-MM-DD
  //   ["2025-01-01", "2025-01-02", ..., "2025-01-31"]
  //   Генерируется в ScheduleTable через getDateRange()

  // === РЕНДЕР ===

  return (
    <tr>
      {/*
        Рендерим ячейку для каждой даты

        Важно:
        - key={date} - уникальный для каждой ячейки в строке
        - employee.id передаём как примитив (строка)
        - date передаём как примитив (строка)

        ScheduleCell мемоизирован - он обновится только если:
        1. employeeId изменился
        2. date изменился
        3. Изменилось значение в scheduleMap для этой конкретной ячейки
      */}
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
  // === ОПТИМИЗАЦИЯ REACT.MEMO ===
  //
  // Компонент НЕ обновляется если:
  // 1. employee - та же ССЫЛКА на объект (не изменился)
  // 2. dates - та же ССЫЛКА на массив (не изменился)
  //
  // Почему сравниваем по ссылке (===), а не deep equal?
  // - ScheduleTable создаёт employees через useMemo
  // - dates тоже создаётся через useMemo
  // - Если данные не изменились - ссылки остаются теми же
  // - Сравнение по ссылке НАМНОГО быстрее глубокого сравнения
  //
  // Пример:
  // Если изменилась ячейка для другого сотрудника:
  // - employee === та же ссылка ✅
  // - dates === та же ссылка ✅
  // - EmployeeRow НЕ обновляется ✅
  // - Но ScheduleCell обновится через свою Zustand подписку ✅

  return (
    prevProps.employee === nextProps.employee &&
    prevProps.dates === nextProps.dates
  );
});

EmployeeRow.displayName = 'EmployeeRow';

export default EmployeeRow;