import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { useClipboardStore } from '../../store/selection';
import { useDateAdminStore } from '../../store/dateAdminStore';

/**
 * AdminInitializer - Компонент для инициализации админ-режима
 *
 * Вынесен отдельно от AdminConsole, чтобы useEffect'ы не вызывали
 * ре-рендер всех дочерних компонентов таблицы.
 *
 * Рендерит null — только управляет side effects.
 *
 * Разделение ответственности:
 * - switchYear — сам вызывает initializeDraft при смене года
 * - AdminInitializer — реагирует только на смену отдела
 */
function AdminInitializer({ currentDepartmentId }) {
  // Инициализация dateAdminStore при входе в админ-режим
  useEffect(() => {
    useDateAdminStore.getState().initializeYear(new Date().getFullYear());

    return () => {
      useAdminStore.getState().clearDraft();
      useClipboardStore.getState().clearAllSelections();
    };
  }, []);

  // Инициализация draft при смене отдела
  // (при смене года — switchYear сам вызывает initializeDraft)
  useEffect(() => {
    if (currentDepartmentId) {
      const currentYear = useDateAdminStore.getState().currentYear;
      if (currentYear) {
        console.log(`🔄 AdminInitializer: инициализация draft для ${currentDepartmentId}/${currentYear}`);
        useAdminStore.getState().initializeDraft(currentDepartmentId, currentYear);
      }
    }
  }, [currentDepartmentId]);

  return null;
}

export default AdminInitializer;
