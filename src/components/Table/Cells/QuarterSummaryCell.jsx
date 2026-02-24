import { memo } from 'react';
import { useAdminStore, useHoursStore } from '../../../store/admin';
import s from '../QuarterSummary.module.css';

/**
 * QuarterSummaryCell — ячейка с итогом часов за квартал
 * Подписывается на конкретный примитив из hoursSummary → ререндерится только при изменении своего значения
 *
 * @param {string} type - 'norm' | 'fact' | 'delta'
 * @param {string} empId - ID сотрудника
 * @param {number} quarter - 1..4
 */
const QuarterSummaryCell = memo(({ type, empId, quarter }) => {
  const fact = useHoursStore(state => state.hoursSummary[`${empId}-Q${quarter}`] ?? 0);

  // editingYear из adminStore, monthNorms из hoursStore
  const editingYear = useAdminStore(state => state.editingYear);
  const norm = useHoursStore(state => {
    const norms = state.monthNorms;
    if (!editingYear) return 0;
    let sum = 0;
    const startMonth = (quarter - 1) * 3 + 1;
    for (let m = startMonth; m < startMonth + 3; m++) {
      const key = `${editingYear}-${String(m).padStart(2, '0')}`;
      sum += (norms[key] ?? 0);
    }
    return sum;
  });

  let value;
  let className = s.cell;

  if (type === 'norm') {
    value = norm;
  } else if (type === 'fact') {
    value = fact;
  } else {
    // delta = fact - norm
    value = fact - norm;
    if (value > 0) className = `${s.cell} ${s.deltaPositive}`;
    else if (value < 0) className = `${s.cell} ${s.deltaNegative}`;
  }

  return (
    <td className={className}>
      {value}
    </td>
  );
});

QuarterSummaryCell.displayName = 'QuarterSummaryCell';

export default QuarterSummaryCell;
