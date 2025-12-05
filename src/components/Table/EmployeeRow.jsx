import { memo } from 'react';

/**
 * EmployeeRow - Строка таблицы с ячейками расписания сотрудника
 *
 * ОПТИМИЗАЦИЯ:
 * - Получает CellComponent как prop из ScheduleTable
 * - НЕ подписывается на editMode (избегаем 100 подписок)
 * - React.memo с кастомным компаратором
 *
 * @param {object} employee - Объект сотрудника из employeeMap
 * @param {string[]} dates - Массив дат в формате YYYY-MM-DD
 * @param {React.Component} CellComponent - ViewScheduleCell или EditableScheduleCell
 */
const EmployeeRow = memo(({ employee, dates, CellComponent }) => {
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
  //
  // CellComponent: ViewScheduleCell или EditableScheduleCell
  //   Определяется ОДИН РАЗ в ScheduleTable, а не 100 раз в каждой строке!
  //   Это избегает 100 подписок на editMode

  // === РЕНДЕР ===

  return (
    <tr>
      {/*
        ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ:

        CellComponent передаётся из ScheduleTable:
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
  // 3. CellComponent - тот же компонент (не изменился режим)
  //
  // Почему сравниваем по ссылке (===), а не deep equal?
  // - ScheduleTable создаёт employees через useMemo
  // - dates тоже создаётся через useMemo
  // - CellComponent - это либо ViewScheduleCell, либо EditableScheduleCell
  // - Если данные не изменились - ссылки остаются теми же
  // - Сравнение по ссылке НАМНОГО быстрее глубокого сравнения
  //
  // Пример:
  // Если изменилась ячейка для другого сотрудника:
  // - employee === та же ссылка ✅
  // - dates === та же ссылка ✅
  // - CellComponent === тот же компонент ✅
  // - EmployeeRow НЕ обновляется ✅
  // - Но ScheduleCell обновится через свою Zustand подписку ✅

  return (
    prevProps.employee === nextProps.employee &&
    prevProps.dates === nextProps.dates &&
    prevProps.CellComponent === nextProps.CellComponent
  );
});

EmployeeRow.displayName = 'EmployeeRow';

export default EmployeeRow;
