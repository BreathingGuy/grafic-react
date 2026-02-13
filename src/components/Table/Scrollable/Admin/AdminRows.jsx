import { memo, useMemo } from 'react';
import { useAdminStore } from '../../../../store/adminStore';
import { useDateAdminStore } from '../../../../store/dateAdminStore';
import AdminEmployeeRow from '../../Rows/AdminEmployeeRow';

/**
 * Вычислить quarterEndSlots и slotToQuarter из monthGroups
 * quarterEndSlots: Set слотов, после которых вставлять итоги (последний день марта, июня, ...)
 * slotToQuarter: { slotIndex: quarterNumber }
 */
function computeQuarterBoundaries(monthGroups) {
  const quarterEndSlots = new Set();
  const slotToQuarter = {};
  let slotOffset = 0;

  for (let i = 0; i < monthGroups.length; i++) {
    slotOffset += monthGroups[i].colspan;
    // Каждые 3 месяца — конец квартала (индекс 2, 5, 8, 11)
    if ((i + 1) % 3 === 0) {
      const lastSlot = slotOffset - 1;
      const quarter = Math.floor(i / 3) + 1;
      quarterEndSlots.add(lastSlot);
      slotToQuarter[lastSlot] = quarter;
    }
  }

  return { quarterEndSlots, slotToQuarter };
}

/**
 * AdminRows - Строки таблицы расписания для админ-режима
 *
 * @param {string} tableId - 'main' | 'offset'
 * @param {Function} useSelectionStore - хук selection store
 */
const AdminRows = memo(({ tableId = 'main', useSelectionStore }) => {
  const employeeIds = useAdminStore(state => state.employeeIds, Object.is);
  const showQuarterSummary = useAdminStore(state => state.showQuarterSummary);
  const monthGroups = useDateAdminStore(state =>
    tableId === 'offset' ? state.offsetMonthGroups : state.monthGroups
  );

  // Стабильные ссылки — пересчитываются только при смене monthGroups
  const { quarterEndSlots, slotToQuarter } = useMemo(
    () => computeQuarterBoundaries(monthGroups),
    [monthGroups]
  );

  return (
    <tbody>
      {employeeIds.map((empId, empIdx) => (
        <AdminEmployeeRow
          key={empId}
          empId={empId}
          empIdx={empIdx}
          tableId={tableId}
          useSelectionStore={useSelectionStore}
          quarterEndSlots={showQuarterSummary ? quarterEndSlots : null}
          slotToQuarter={showQuarterSummary ? slotToQuarter : null}
        />
      ))}
    </tbody>
  );
}, (prev, next) =>
  prev.tableId === next.tableId &&
  prev.useSelectionStore === next.useSelectionStore
);

AdminRows.displayName = 'AdminRows';

export default AdminRows;
