import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { useClipboardStore } from '../../store/selection';

/**
 * AdminInitializer - Компонент для инициализации админ-режима
 *
 * Рендерит null — только управляет side effects.
 *
 * Вся логика инициализации теперь в enterAdminContext:
 * - Вход в консоль: вызывается здесь при mount
 * - Смена года: switchYear вызывает enterAdminContext
 * - Смена отдела: setAdminDepartment вызывает enterAdminContext
 */
function AdminInitializer({ currentDepartmentId }) {
  useEffect(() => {
    // Первичная инициализация при входе в админ-режим
    if (currentDepartmentId) {
      const currentYear = new Date().getFullYear();
      console.log(`🚀 AdminInitializer: первичный вход ${currentDepartmentId}/${currentYear}`);
      useAdminStore.getState().enterAdminContext(currentDepartmentId, currentYear);
    }

    // Cleanup при выходе из админ-режима
    return () => {
      useAdminStore.getState().clearDraft();
      useClipboardStore.getState().clearAllSelections();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Только mount/unmount — смена отдела обрабатывается в setAdminDepartment

  return null;
}

export default AdminInitializer;
