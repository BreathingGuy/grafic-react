import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAdminStore } from './adminStore';
import { useVersionsStore } from '../versionsStore';

export const useAdminAuthStore = create(
  persist(
    (set, get) => ({
      // === AUTHENTICATION ===
      isAuthenticated: false,
      user: null,                    // { userId, email, name, token }
      ownedDepartments: [],          // ["dept-1"]
      editableDepartments: [],       // ["dept-1", "dept-2"]

      // === UI STATE ===
      isAdminMode: false,            // Режим админ-консоли

      // === AUTH ACTIONS ===

      login: async (email, _password) => {
        void _password; // Будет использоваться при интеграции API
        // TODO: API call

        // Временная заглушка для разработки
        set({
          isAuthenticated: true,
          user: {
            userId: '1',
            email: email,
            name: 'Admin',
            token: 'dev-token'
          },
          ownedDepartments: ['1'],
          editableDepartments: ['1', '2']
        });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          ownedDepartments: [],
          editableDepartments: [],
          isAdminMode: false
        });

        // Сброс draft и версий
        useAdminStore.getState().clearDraft();
        useVersionsStore.getState().resetVersions();
      },

      toggleAdminMode: () => {
        set(state => ({ isAdminMode: !state.isAdminMode }));
      },

      setAdminMode: (isAdmin) => {
        set({ isAdminMode: isAdmin });
      },

      canEditDepartment: (departmentId) => {
        return get().editableDepartments.includes(departmentId);
      },

      isOwner: (departmentId) => {
        return get().ownedDepartments.includes(departmentId);
      }
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        ownedDepartments: state.ownedDepartments,
        editableDepartments: state.editableDepartments
      })
    }
  )
);

export default useAdminAuthStore;
