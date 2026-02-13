/**
 * hoursCalc.js — утилиты для расчёта часов
 */

/**
 * Построить карту code → hours из statusConfig
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
 * Определить квартал по дате "YYYY-MM-DD"
 * @returns {number} 1..4
 */
export function getQuarterFromDate(dateStr) {
  const month = parseInt(dateStr.slice(5, 7), 10); // 1..12
  return Math.ceil(month / 3);
}

/**
 * Полный расчёт hoursSummary из draftSchedule
 * @param {Object} draftSchedule - { "empId-date": "status" }
 * @param {string[]} employeeIds
 * @param {Object} codeToHours - { "Д": 8, ... }
 * @param {number} year - фильтровать только этот год
 * @returns {Object} { "empId-Q1": hours, "empId-Q2": hours, ... }
 */
export function calcFullHoursSummary(draftSchedule, employeeIds, codeToHours, year) {
  const summary = {};
  const yearPrefix = `${year}-`;

  // Инициализируем нулями
  for (const empId of employeeIds) {
    for (let q = 1; q <= 4; q++) {
      summary[`${empId}-Q${q}`] = 0;
    }
  }

  // Считаем
  for (const key in draftSchedule) {
    // key = "empId-YYYY-MM-DD", empId может содержать цифры — берём дату с конца
    const dateStr = key.slice(-10); // "YYYY-MM-DD"
    if (!dateStr.startsWith(yearPrefix)) continue;

    const empId = key.slice(0, key.length - 11); // всё до "-YYYY-MM-DD"
    const status = draftSchedule[key];
    if (!status) continue;

    const hours = codeToHours[status] ?? 0;
    if (hours === 0) continue;

    const quarter = getQuarterFromDate(dateStr);
    const summaryKey = `${empId}-Q${quarter}`;
    if (summaryKey in summary) {
      summary[summaryKey] += hours;
    }
  }

  return summary;
}

/**
 * Дельта-обновление hoursSummary при изменении одной ячейки
 * @param {Object} currentSummary - текущий hoursSummary
 * @param {string} empId
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {string} oldStatus
 * @param {string} newStatus
 * @param {Object} codeToHours
 * @returns {Object|null} - новый hoursSummary или null если не изменился
 */
export function deltaUpdateSummary(currentSummary, empId, dateStr, oldStatus, newStatus, codeToHours) {
  const oldHours = codeToHours[oldStatus] ?? 0;
  const newHours = codeToHours[newStatus] ?? 0;
  const diff = newHours - oldHours;
  if (diff === 0) return null;

  const quarter = getQuarterFromDate(dateStr);
  const key = `${empId}-Q${quarter}`;
  return {
    ...currentSummary,
    [key]: (currentSummary[key] ?? 0) + diff
  };
}

/**
 * Дельта-обновление hoursSummary при batch-изменении (paste)
 * @param {Object} currentSummary
 * @param {Object} updates - { "empId-date": "newStatus" }
 * @param {Object} oldSchedule - текущий draftSchedule (до обновления)
 * @param {Object} codeToHours
 * @param {number} year
 * @returns {Object} - новый hoursSummary
 */
export function batchDeltaUpdateSummary(currentSummary, updates, oldSchedule, codeToHours, year) {
  const yearPrefix = `${year}-`;
  const newSummary = { ...currentSummary };
  let changed = false;

  for (const key in updates) {
    const dateStr = key.slice(-10);
    if (!dateStr.startsWith(yearPrefix)) continue;

    const empId = key.slice(0, key.length - 11);
    const oldStatus = oldSchedule[key] ?? '';
    const newStatus = updates[key] ?? '';

    const oldHours = codeToHours[oldStatus] ?? 0;
    const newHours = codeToHours[newStatus] ?? 0;
    const diff = newHours - oldHours;
    if (diff === 0) continue;

    const quarter = getQuarterFromDate(dateStr);
    const summaryKey = `${empId}-Q${quarter}`;
    newSummary[summaryKey] = (newSummary[summaryKey] ?? 0) + diff;
    changed = true;
  }

  return changed ? newSummary : currentSummary;
}
