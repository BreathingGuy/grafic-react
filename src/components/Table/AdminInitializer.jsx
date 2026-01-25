import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useDateUserStore } from '../../store/dateUserStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

/**
 * AdminInitializer - Логика и side effects для админ режима
 *
 * Содержит:
 * - Подписки на stores для инициализации
 * - useKeyboardShortcuts
 * - useEffect логику для setup/cleanup
 *
 * НЕ рендерит UI - возвращает null
 * Это позволяет избежать каскадных ре-рендеров UI при изменении stores
 */
function AdminInitializer() {
  // Keyboard shortcuts
  useKeyboardShortcuts();

  // Подписки для инициализации
  const editingDepartmentId = useAdminStore(s => s.editingDepartmentId);
  const editingYear = useAdminStore(s => s.editingYear);
  const currentDepartmentId = useWorkspaceStore(s => s.currentDepartmentId);
  const userCurrentYear = useDateUserStore(s => s.currentYear);

  // Инициализация при первом входе в админ режим
  useEffect(() => {
    // Если editingDepartmentId не установлен, но есть currentDepartmentId
    // значит мы только что вошли в админ режим
    if (currentDepartmentId && !editingDepartmentId) {
      console.log(`🔄 Первый вход в админ режим для отдела ${currentDepartmentId}`);
      const adminStore = useAdminStore.getState();

      // Устанавливаем контекст редактирования
      adminStore.setEditingContext(currentDepartmentId, userCurrentYear);
    }
  }, [currentDepartmentId, editingDepartmentId, userCurrentYear]);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      // При размонтировании очищаем только данные, но НЕ выходим из админ режима
      // clearDraft() вызывается только при явном выходе из админ режима (кнопка "Выйти")
      useSelectionStore.getState().clearSelection();
    };
  }, []);

  // Этот компонент не рендерит UI
  return null;
}

export default AdminInitializer;
