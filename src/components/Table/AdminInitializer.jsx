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
 */
function AdminInitializer({ currentDepartmentId }) {
  const currentYear = useDateAdminStore(s => s.currentYear);

  // Инициализация dateAdminStore при входе в админ-режим
  useEffect(() => {
    useDateAdminStore.getState().initializeYear(new Date().getFullYear());

    return () => {
      useAdminStore.getState().clearDraft();
      useClipboardStore.getState().clearAllSelections();
    };
  }, []);

  // Инициализация draft при смене отдела/года
  useEffect(() => {
    if (currentDepartmentId && currentYear) {
      console.log(`🔄 AdminInitializer: инициализация draft для ${currentDepartmentId}/${currentYear}`);
      // clearAllSelections уже вызывается в setAdminDepartment / switchYear
      useAdminStore.getState().initializeDraft(currentDepartmentId, currentYear);
    }
  }, [currentDepartmentId, currentYear]);

  return null;
}

export default AdminInitializer;
