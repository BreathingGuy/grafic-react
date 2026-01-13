import { memo } from 'react';
import { useDateAdminStore } from '../../../store/dateAdminStore';
import { useDateUserStore } from '../../../store/dateUserStore';

/**
 * MonthHeaders - Заголовки месяцев
 *
 * Сам подписывается на нужный store чтобы не вызывать ререндер родителя.
 *
 * @param {boolean} isAdmin - режим админа (использовать dateAdminStore)
 * @param {string} tableId - 'main' | 'offset' (только для админа)
 */
const MonthHeaders = memo(({ isAdmin = false, tableId = 'main' }) => {
  // Подписываемся на нужный store
  const adminMainGroups = useDateAdminStore(s => s.monthGroups);
  const adminOffsetGroups = useDateAdminStore(s => s.offsetMonthGroups);
  const userGroups = useDateUserStore(s => s.monthGroups);

  // Выбираем нужные данные
  let monthGroups;
  if (isAdmin) {
    monthGroups = tableId === 'offset' ? adminOffsetGroups : adminMainGroups;
  } else {
    monthGroups = userGroups;
  }

  return (
    <tr>
      {monthGroups.map((group, i) => (
        <th key={i} colSpan={group.colspan}>
          {group.month}
        </th>
      ))}
    </tr>
  );
});

MonthHeaders.displayName = 'MonthHeaders';

export default MonthHeaders;