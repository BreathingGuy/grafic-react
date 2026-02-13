import { memo } from 'react';
import { useAdminStore } from '../../../store/adminStore';

/**
 * QuarterSummaryCell — ячейка с итогом часов за квартал
 * Подписывается на конкретный примитив из hoursSummary → ререндерится только при изменении своего значения
 *
 * @param {string} type - 'norm' | 'fact' | 'delta'
 * @param {string} empId - ID сотрудника
 * @param {number} quarter - 1..4
 */
const QuarterSummaryCell = memo(({ type, empId, quarter }) => {
  const fact = useAdminStore(state => state.hoursSummary[`${empId}-Q${quarter}`] ?? 0);

  // Норма: сумма 3-х месяцев квартала
  const norm = useAdminStore(state => {
    const norms = state.monthNorms;
    const year = state.editingYear;
    if (!year) return 0;
    let sum = 0;
    const startMonth = (quarter - 1) * 3 + 1;
    for (let m = startMonth; m < startMonth + 3; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`;
      sum += (norms[key] ?? 0);
    }
    return sum;
  });

  let value;
  let style = { ...cellStyle };

  if (type === 'norm') {
    value = norm;
  } else if (type === 'fact') {
    value = fact;
  } else {
    // delta = fact - norm
    value = fact - norm;
    if (value > 0) style.color = '#2e7d32';
    else if (value < 0) style.color = '#c62828';
  }

  return (
    <td style={style}>
      {value}
    </td>
  );
});

const cellStyle = {
  textAlign: 'center',
  fontSize: '11px',
  fontWeight: 500,
  padding: '0 2px',
  backgroundColor: '#f5f5f5',
  borderLeft: '1px solid #000',
  borderRight: '1px solid #000',
  minWidth: '28px',
  whiteSpace: 'nowrap'
};

QuarterSummaryCell.displayName = 'QuarterSummaryCell';

export default QuarterSummaryCell;
