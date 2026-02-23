/**
 * adminOrchestrator.js — координация между сторами при входе/смене в админ-режиме
 *
 * Вынесен из adminStore чтобы стор не знал про 6+ других сторов.
 * Сторы принимают данные, оркестратор координирует последовательность.
 */
import { useAdminStore } from '../store/admin/adminStore';
import { useHoursStore } from '../store/admin/hoursStore';
import { useVersionsStore } from '../store/versionsStore';
import { useMetaStore } from '../store/metaStore';
import { useDateAdminStore } from '../store/dateAdminStore';
import { useFetchWebStore } from '../store/fetchWebStore';

/**
 * Единая точка входа в админ-контекст
 * Используется для: входа в консоль, смены года, смены отдела
 */
export async function enterAdminContext(departmentId, year) {
  const adminStore = useAdminStore.getState();
  const currentDeptId = adminStore.editingDepartmentId;
  const isDepartmentChange = departmentId !== currentDeptId;

  console.log(`🚀 enterAdminContext: ${departmentId}/${year} (was: ${currentDeptId}/${adminStore.editingYear})`);

  // 1. Сброс версий
  useVersionsStore.getState().resetVersions();

  // 2. При смене отдела — загрузить годы и проверить что запрошенный год существует
  let targetYear = Number(year);
  if (isDepartmentChange) {
    useAdminStore.setState({ availableYears: [], editingDepartmentId: departmentId });

    useMetaStore.getState().loadDepartmentConfig(departmentId);

    try {
      const years = await useAdminStore.getState().loadAvailableYears(departmentId);
      if (years && years.length > 0 && !years.includes(String(targetYear))) {
        targetYear = Number(years[years.length - 1]);
        console.log(`⚠️ Год ${year} не найден для ${departmentId}, fallback на ${targetYear}`);
      }
    } catch (error) {
      console.error('Не удалось загрузить годы:', error);
    }
  }

  // 3. Инициализация дат
  useDateAdminStore.getState().initializeYear(targetYear);

  // 4. Загрузка draft
  await useAdminStore.getState().initializeDraft(departmentId, targetYear);

  // 5. Загрузка норм и пересчёт часов
  const hoursStore = useHoursStore.getState();
  const norms = useFetchWebStore.getState().fetchMonthNorms(departmentId, targetYear);
  hoursStore.setMonthNorms(norms);
  hoursStore.refreshCodeToHours();

  const { draftSchedule, employeeIds } = useAdminStore.getState();
  hoursStore.recalcHoursSummary(draftSchedule, employeeIds, targetYear);
}

/**
 * Переключить год (обёртка над enterAdminContext)
 */
export async function switchYear(year) {
  const { editingDepartmentId } = useAdminStore.getState();
  if (!editingDepartmentId) return;

  await enterAdminContext(editingDepartmentId, Number(year));
}
