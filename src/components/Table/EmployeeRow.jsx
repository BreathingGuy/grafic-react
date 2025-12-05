import { memo } from 'react';
import { useAdminStore } from '../../store/adminStore';
import ViewScheduleCell from './ViewScheduleCell';
import EditableScheduleCell from './EditableScheduleCell';

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

  // === УСЛОВНЫЙ РЕНДЕР ЯЧЕЕК ===
  // Определяем режим редактирования из adminStore
  const editMode = useAdminStore(state => state.editMode);

  // Выбираем компонент ячейки в зависимости от режима:
  // - editMode = true → EditableScheduleCell (админ, полная функциональность)
  // - editMode = false → ViewScheduleCell (просмотр, облегчённая версия)
  const CellComponent = editMode ? EditableScheduleCell : ViewScheduleCell;

  // === РЕНДЕР ===

  return (
    <tr>
      {/*
        ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ:

        Условный рендер компонента ячейки:
        - ViewScheduleCell (просмотр):
          * 1 Zustand подписка (вместо 3)
          * 2 useMemo (вместо 4)
          * Нет useState, useCallback
          * В 2-3 раза быстрее

        - EditableScheduleCell (редактирование):
          * 3 Zustand подписки
          * 4 useMemo, 2 useCallback
          * Полная функциональность редактирования

        Важно:
        - key={date} - уникальный для каждой ячейки в строке
        - employee.id передаём как примитив (строка)
        - date передаём как примитив (строка)

        Обе ячейки мемоизированы - они обновятся только если:
        1. employeeId изменился
        2. date изменился
        3. Изменилось значение в scheduleMap для этой конкретной ячейки
      */}
      {dates.map(date => (
        <CellComponent
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