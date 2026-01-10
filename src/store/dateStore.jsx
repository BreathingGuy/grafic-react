/**
 * dateStore.jsx — файл для обратной совместимости
 *
 * Re-export из dateUserStore.
 * Для новых компонентов используйте напрямую:
 * - dateUserStore — для user view
 * - dateAdminStore — для admin view
 */
export { useDateUserStore, useDateUserStore as useDateStore } from './dateUserStore';
export { default } from './dateUserStore';
