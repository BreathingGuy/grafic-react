import { memo, Fragment } from 'react';
import { useDateAdminStore } from '../../../store/dateAdminStore';
import { useAdminStore } from '../../../store/adminStore';
import { useMetaStore } from '../../../store/metaStore';
import { buildCodeToHours, calcHoursForDates } from '../../../utils/hoursCalc';
import AdminScheduleCell from '../Cells/AdminScheduleCell';

const summaryCellStyle = {
  backgroundColor: '#e8f0fe',
  fontSize: '11px',
  fontWeight: 600,
  textAlign: 'center',
  padding: '2px',
  whiteSpace: 'nowrap',
  minWidth: '30px'
};

const deltaPosStyle = { ...summaryCellStyle, color: '#2e7d32' };
const deltaNegStyle = { ...summaryCellStyle, color: '#d32f2f' };

/**
 * AdminEmployeeRow - Строка сотрудника для админской консоли
 */
const AdminEmployeeRow = memo(({ empId, empIdx, tableId = 'main', useSelectionStore }) => {
  const visibleSlots = useDateAdminStore(state => state.visibleSlots);
  const slotToDate = useDateAdminStore(state => state.slotToDate);
  const offsetSlotToDate = useDateAdminStore(state => state.offsetSlotToDate);
  const monthGroups = useDateAdminStore(state => state.monthGroups);
  const offsetMonthGroups = useDateAdminStore(state => state.offsetMonthGroups);

  const showQuarterSummary = useAdminStore(state => state.showQuarterSummary);
  const draftSchedule = useAdminStore(state => state.draftSchedule);
  const monthNorms = useAdminStore(state => state.monthNorms);
  const statusConfig = useMetaStore(state => state.currentDepartmentConfig?.statusConfig);

  const dateMap = tableId === 'main' ? slotToDate : offsetSlotToDate;
  const groups = tableId === 'main' ? monthGroups : offsetMonthGroups;

  // Предвычислить quarter boundaries + данные для расчёта
  let quarterEndSlots = null;
  let quarterData = null;

  if (showQuarterSummary && groups.length > 0) {
    quarterEndSlots = new Set();
    quarterData = {};
    const codeToHours = buildCodeToHours(statusConfig);

    let slotIdx = -1;
    let currentQuarterDates = [];

    for (let i = 0; i < groups.length; i++) {
      for (let s = 0; s < groups[i].colspan; s++) {
        slotIdx++;
        const date = dateMap[slotIdx];
        if (date) currentQuarterDates.push(date);
      }

      if ((i + 1) % 3 === 0) {
        quarterEndSlots.add(slotIdx);

        const fact = calcHoursForDates(empId, currentQuarterDates, draftSchedule, codeToHours);
        const months = new Set(currentQuarterDates.map(d => d.substring(0, 7)));
        let norm = 0;
        for (const m of months) {
          norm += (monthNorms[m] ?? 0);
        }

        quarterData[slotIdx] = { norm, fact, delta: fact - norm };
        currentQuarterDates = [];
      }
    }
  }

  return (
    <tr>
      {visibleSlots.map(slotIndex => (
        <Fragment key={slotIndex}>
          <AdminScheduleCell
            employeeId={empId}
            slotIndex={slotIndex}
            empIdx={empIdx}
            tableId={tableId}
            useSelectionStore={useSelectionStore}
          />
          {quarterEndSlots && quarterEndSlots.has(slotIndex) && (() => {
            const q = quarterData[slotIndex];
            return (
              <>
                <td style={summaryCellStyle}>{q.norm}</td>
                <td style={summaryCellStyle}>{q.fact}</td>
                <td style={q.delta > 0 ? deltaPosStyle : q.delta < 0 ? deltaNegStyle : summaryCellStyle}>
                  {q.delta > 0 ? `+${q.delta}` : q.delta}
                </td>
              </>
            );
          })()}
        </Fragment>
      ))}
    </tr>
  );
}, (prevProps, nextProps) => {
  return prevProps.empId === nextProps.empId &&
         prevProps.empIdx === nextProps.empIdx &&
         prevProps.tableId === nextProps.tableId &&
         prevProps.useSelectionStore === nextProps.useSelectionStore;
});

AdminEmployeeRow.displayName = 'AdminEmployeeRow';

export default AdminEmployeeRow;
