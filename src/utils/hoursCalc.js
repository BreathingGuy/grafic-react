/**
 * hoursCalc.js — расчёт фактических часов из расписания
 *
 * Использует statusConfig.hours для каждого кода статуса.
 */

/**
 * Построить lookup: code → hours из statusConfig
 * @param {Array} statusConfig - [{ code, hours, ... }]
 * @returns {Object} { "Д": 8, "В": 0, ... }
 */
export function buildCodeToHours(statusConfig) {
  const map = {};
  if (!statusConfig) return map;
  for (const s of statusConfig) {
    map[s.code] = s.hours ?? 0;
  }
  return map;
}

/**
 * Рассчитать сумму часов сотрудника за набор дат
 * @param {string} employeeId
 * @param {string[]} dates - ["2025-01-01", "2025-01-02", ...]
 * @param {Object} schedule - { "1000-2025-01-01": "Д", ... }
 * @param {Object} codeToHours - { "Д": 8, "В": 0, ... }
 * @returns {number}
 */
export function calcHoursForDates(employeeId, dates, schedule, codeToHours) {
  let total = 0;
  for (const date of dates) {
    const status = schedule[`${employeeId}-${date}`];
    if (status) {
      total += (codeToHours[status] ?? 0);
    }
  }
  return total;
}
