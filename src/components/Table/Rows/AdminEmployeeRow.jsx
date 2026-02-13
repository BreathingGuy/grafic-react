import { memo } from 'react';
import { useDateAdminStore } from '../../../store/dateAdminStore';
import { useAdminStore } from '../../../store/adminStore';
import AdminScheduleCell from '../Cells/AdminScheduleCell';
import QuarterSummaryCell from '../Cells/QuarterSummaryCell';

/**
 * AdminEmployeeRow - Строка сотрудника для админской консоли
 * При showQuarterSummary=true вставляет Н/Ф/Δ ячейки после каждого квартала
 *
 * @param {string} tableId - 'main' | 'offset'
 * @param {Function} useSelectionStore - хук selection store
 * @param {Set|null} quarterEndSlots - множество слотов после которых вставлять итоги
 * @param {Object|null} slotToQuarter - маппинг slot → quarter number
 */
const AdminEmployeeRow = memo(({ empId, empIdx, tableId = 'main', useSelectionStore, quarterEndSlots, slotToQuarter }) => {
  const visibleSlots = useDateAdminStore(state => state.visibleSlots);
  const showQuarterSummary = useAdminStore(state => state.showQuarterSummary);

  if (!showQuarterSummary || !quarterEndSlots) {
    return (
      <tr>
        {visibleSlots.map(slotIndex => (
          <AdminScheduleCell
            key={slotIndex}
            employeeId={empId}
            slotIndex={slotIndex}
            empIdx={empIdx}
            tableId={tableId}
            useSelectionStore={useSelectionStore}
          />
        ))}
      </tr>
    );
  }

  return (
    <tr>
      {visibleSlots.flatMap(slotIndex => {
        const cell = (
          <AdminScheduleCell
            key={slotIndex}
            employeeId={empId}
            slotIndex={slotIndex}
            empIdx={empIdx}
            tableId={tableId}
            useSelectionStore={useSelectionStore}
          />
        );

        if (quarterEndSlots.has(slotIndex)) {
          const q = slotToQuarter[slotIndex];
          return [
            cell,
            <QuarterSummaryCell key={`q${q}-norm`} type="norm" empId={empId} quarter={q} />,
            <QuarterSummaryCell key={`q${q}-fact`} type="fact" empId={empId} quarter={q} />,
            <QuarterSummaryCell key={`q${q}-delta`} type="delta" empId={empId} quarter={q} />
          ];
        }

        return [cell];
      })}
    </tr>
  );
}, (prevProps, nextProps) => {
  return prevProps.empId === nextProps.empId &&
         prevProps.empIdx === nextProps.empIdx &&
         prevProps.tableId === nextProps.tableId &&
         prevProps.useSelectionStore === nextProps.useSelectionStore &&
         prevProps.quarterEndSlots === nextProps.quarterEndSlots &&
         prevProps.slotToQuarter === nextProps.slotToQuarter;
});

AdminEmployeeRow.displayName = 'AdminEmployeeRow';

export default AdminEmployeeRow;
