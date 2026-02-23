import { useEffect } from 'react';
import { useAdminStore } from '../../store/admin';
import { useClipboardStore } from '../../store/selection';
import { enterAdminContext } from '../../services/adminOrchestrator';

/**
 * AdminInitializer - Компонент для инициализации админ-режима
 *
 * Рендерит null — только управляет side effects.
 * Координация через adminOrchestrator.
 */
function AdminInitializer({ currentDepartmentId }) {
  useEffect(() => {
    if (currentDepartmentId) {
      const currentYear = new Date().getFullYear();
      console.log(`🚀 AdminInitializer: первичный вход ${currentDepartmentId}/${currentYear}`);
      enterAdminContext(currentDepartmentId, currentYear);
    }

    return () => {
      useAdminStore.getState().clearDraft();
      useClipboardStore.getState().clearAllSelections();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default AdminInitializer;
