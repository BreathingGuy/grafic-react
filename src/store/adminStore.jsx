import {create} from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useScheduleStore } from './scheduleStore';

export const useAdminStore = create(
  devtools(
    persist(
      (set, get) => ({
        // === STATE ===
        isAuthenticated: false,
        user: null,                    // { userId, email, name, token }
        ownedDepartments: [],          // ["dept-1"]
        editableDepartments: [],       // ["dept-1", "dept-2"]
        
        // Режим редактирования
        editMode: false,
        draftSchedule: {},             // Черновик изменений
        changedCells: new Set(),       // Подсветка после публикации
        hasUnsavedChanges: false,

        // Выделение и редактирование ячеек
        selectedCells: [],             // [{ empId, date, rowIndex, colIndex }, ...]
        startCell: null,               // Начальная ячейка выделения
        copiedData: null,              // Скопированные данные { data: [[]], rows, cols }
        undoStack: [],                 // Стек для отмены изменений
        maxUndoStack: 50,              // Максимальный размер стека отмены
        
        // === ACTIONS ===
        
        // Вход
        login: async (email, password) => {
          // const response = await api.post('/api/auth/login', { email, password });
          
          set({
            isAuthenticated: true,
            user: {
              userId: response.userId,
              email: response.email,
              name: response.name,
              token: response.token
            },
            ownedDepartments: response.ownedDepartments,
            editableDepartments: response.editableDepartments
          });
        },
        
        // Выход
        logout: () => {
          set({
            isAuthenticated: false,
            user: null,
            ownedDepartments: [],
            editableDepartments: [],
            editMode: false,
            draftSchedule: {},
            changedCells: new Set(),
            hasUnsavedChanges: false,
            selectedCells: [],
            startCell: null,
            copiedData: null,
            undoStack: []
          });
        },
        
        // Проверка прав на редактирование отдела
        canEditDepartment: (departmentId) => {
          return get().editableDepartments.includes(departmentId);
        },
        
        // Проверка прав владельца
        isOwner: (departmentId) => {
          return get().ownedDepartments.includes(departmentId);
        },
        
        // Включить режим редактирования
        enableEditMode: async (departmentId) => {
          // Загружаем черновик
          // const response = await api.get(
          //   `/api/admin/departments/${departmentId}/draft?year=2025`,
          //   { headers: { Authorization: `Bearer ${get().user.token}` } }
          // );
          
          set({
            editMode: true,
            draftSchedule: response.draftSchedule || {}
          });
        },
        
        // Выключить режим редактирования
        disableEditMode: () => {
          if (get().hasUnsavedChanges) {
            const confirm = window.confirm('Есть несохранённые изменения. Выйти?');
            if (!confirm) return;
          }

          set({
            editMode: false,
            draftSchedule: {},
            hasUnsavedChanges: false,
            selectedCells: [],
            startCell: null,
            copiedData: null,
            undoStack: []
          });
        },
        
        // Обновить ячейку в черновике
        updateDraftCell: (employeeId, date, status) => {
          const key = `${employeeId}-${date}`;
          
          set(state => ({
            draftSchedule: {
              ...state.draftSchedule,
              [key]: status
            },
            hasUnsavedChanges: true
          }));
        },
        
        // Сохранить черновик
        saveDraft: async (departmentId) => {
          const { draftSchedule, user } = get();
          
          // await api.post(
          //   `/api/admin/departments/${departmentId}/draft/save`,
          //   { draftSchedule },
          //   { headers: { Authorization: `Bearer ${user.token}` } }
          // );
          
          set({ hasUnsavedChanges: false });
        },
        
        // Опубликовать черновик
        publishDraft: async (departmentId) => {
          const { draftSchedule, user } = get();
          
          // await api.post(
          //   `/api/admin/departments/${departmentId}/draft/publish`,
          //   { draftSchedule },
          //   { headers: { Authorization: `Bearer ${user.token}` } }
          // );
          
          // Обновляем production расписание
          const scheduleStore = useScheduleStore.getState();
          scheduleStore.set(state => ({
            scheduleMap: {
              ...state.scheduleMap,
              ...draftSchedule
            }
          }));
          
          // Помечаем изменённые ячейки
          const changedKeys = Object.keys(draftSchedule).filter(key =>
            draftSchedule[key] !== scheduleStore.scheduleMap[key]
          );
          
          set({
            changedCells: new Set(changedKeys),
            draftSchedule: {},
            hasUnsavedChanges: false
          });
          
          // Сбрасываем подсветку через 5 секунд
          setTimeout(() => {
            set({ changedCells: new Set() });
          }, 5000);
        },
        
        // === SELECTION & EDITING ===

        // Начать выделение
        setStartCell: (cell) => {
          set({ startCell: cell, selectedCells: [cell] });
        },

        // Очистить выделение
        clearSelection: () => {
          set({ selectedCells: [], startCell: null });
        },

        // Выделить диапазон ячеек
        selectRange: (startCell, endCell, allCells) => {
          if (!startCell || !endCell) return;

          const minRow = Math.min(startCell.rowIndex, endCell.rowIndex);
          const maxRow = Math.max(startCell.rowIndex, endCell.rowIndex);
          const minCol = Math.min(startCell.colIndex, endCell.colIndex);
          const maxCol = Math.max(startCell.colIndex, endCell.colIndex);

          const selected = allCells.filter(cell =>
            cell.rowIndex >= minRow &&
            cell.rowIndex <= maxRow &&
            cell.colIndex >= minCol &&
            cell.colIndex <= maxCol
          );

          set({ selectedCells: selected });
        },

        // Проверка, выделена ли ячейка
        isCellSelected: (empId, date) => {
          const { selectedCells } = get();
          return selectedCells.some(cell => cell.empId === empId && cell.date === date);
        },

        // Копировать выделенные ячейки
        copySelected: () => {
          const { selectedCells, draftSchedule } = get();
          const scheduleStore = useScheduleStore.getState();

          if (selectedCells.length === 0) return;

          const minRow = Math.min(...selectedCells.map(c => c.rowIndex));
          const maxRow = Math.max(...selectedCells.map(c => c.rowIndex));
          const minCol = Math.min(...selectedCells.map(c => c.colIndex));
          const maxCol = Math.max(...selectedCells.map(c => c.colIndex));

          const rows = maxRow - minRow + 1;
          const cols = maxCol - minCol + 1;
          const data = Array(rows).fill(null).map(() => Array(cols).fill(''));

          selectedCells.forEach(cell => {
            const r = cell.rowIndex - minRow;
            const c = cell.colIndex - minCol;
            const key = `${cell.empId}-${cell.date}`;
            data[r][c] = draftSchedule[key] || scheduleStore.getCellStatus(cell.empId, cell.date) || '';
          });

          set({ copiedData: { data, rows, cols } });
        },

        // Вставить скопированные данные
        pasteSelected: () => {
          const { selectedCells, copiedData, draftSchedule } = get();

          if (selectedCells.length === 0 || !copiedData) return;

          // Сохраняем состояние для отмены
          get().saveState();

          const minRow = Math.min(...selectedCells.map(c => c.rowIndex));
          const maxRow = Math.max(...selectedCells.map(c => c.rowIndex));
          const minCol = Math.min(...selectedCells.map(c => c.colIndex));
          const maxCol = Math.max(...selectedCells.map(c => c.colIndex));

          const selectedRows = maxRow - minRow + 1;
          const selectedCols = maxCol - minCol + 1;
          const { data, rows: clipRows, cols: clipCols } = copiedData;

          const newDraftSchedule = { ...draftSchedule };

          // Различные режимы вставки (как в примере)
          if ((selectedCols === 1 && clipRows === 1) || (selectedCols === clipCols && clipRows === 1)) {
            // Вставка одной строки на все выделенные строки
            for (let i = 0; i < selectedRows; i++) {
              data.forEach((row, rIndex) => {
                row.forEach((value, cIndex) => {
                  const cellData = selectedCells.find(
                    c => c.rowIndex === minRow + i && c.colIndex === minCol + cIndex
                  );
                  if (cellData) {
                    const key = `${cellData.empId}-${cellData.date}`;
                    newDraftSchedule[key] = value;
                  }
                });
              });
            }
          } else if (selectedRows % clipRows === 0 && selectedCols % clipCols === 0) {
            // Тайловая вставка
            for (let j = 0; j < selectedCols; j += clipCols) {
              for (let i = 0; i < selectedRows; i += clipRows) {
                data.forEach((row, rIndex) => {
                  row.forEach((value, cIndex) => {
                    const cellData = selectedCells.find(
                      c => c.rowIndex === minRow + rIndex + i && c.colIndex === minCol + cIndex + j
                    );
                    if (cellData) {
                      const key = `${cellData.empId}-${cellData.date}`;
                      newDraftSchedule[key] = value;
                    }
                  });
                });
              }
            }
          } else {
            // Обычная вставка
            data.forEach((row, rIndex) => {
              row.forEach((value, cIndex) => {
                const cellData = selectedCells.find(
                  c => c.rowIndex === minRow + rIndex && c.colIndex === minCol + cIndex
                );
                if (cellData) {
                  const key = `${cellData.empId}-${cellData.date}`;
                  newDraftSchedule[key] = value;
                }
              });
            });
          }

          set({ draftSchedule: newDraftSchedule, hasUnsavedChanges: true });
        },

        // Сохранить состояние для отмены
        saveState: () => {
          const { draftSchedule, undoStack, maxUndoStack } = get();
          const newStack = [...undoStack, { ...draftSchedule }];

          // Ограничиваем размер стека
          if (newStack.length > maxUndoStack) {
            newStack.shift();
          }

          set({ undoStack: newStack });
        },

        // Отменить последнее изменение
        undo: () => {
          const { undoStack } = get();

          if (undoStack.length === 0) return;

          const newStack = [...undoStack];
          const previousState = newStack.pop();

          set({
            draftSchedule: previousState,
            undoStack: newStack,
            hasUnsavedChanges: true
          });
        },

        // WebSocket: обновление от другого админа
        handlePublishUpdate: (update) => {
          const { changes, departmentId } = update;
          
          // Обновляем production
          const scheduleStore = useScheduleStore.getState();
          scheduleStore.set(state => ({
            scheduleMap: {
              ...state.scheduleMap,
              ...changes
            }
          }));
          
          // Подсветка
          set({ changedCells: new Set(Object.keys(changes)) });
          
          setTimeout(() => {
            set({ changedCells: new Set() });
          }, 5000);
        }
      }),
      {
        name: 'admin-storage', // имя в localStorage
        partialize: (state) => ({
          // Сохраняем только токен и базовую инфу
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          ownedDepartments: state.ownedDepartments,
          editableDepartments: state.editableDepartments
        })
      }
    ),
    { name: 'AdminStore' }
  )
);

export default useAdminStore;