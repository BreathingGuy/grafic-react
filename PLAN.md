# План оптимизации и наведения порядка в grafic-react

---

## Фаза 1: Критические баги и быстрые победы ✅

### 1.1 Исправить баг ViewScheduleCell memo
- `src/components/Table/Cells/ViewScheduleCell.jsx` — memo сравнивает `prevProps.date`, но `date` не передаётся как проп → memo бесполезен, ячейки ререндерятся всегда

### 1.2 Исправить SelectionOverlay подписку
- `src/components/Table/SelectionOverlay.jsx:83-84` — всегда подписывается на `state.slotToDate` (main), даже когда рендерится в offset таблице → лишняя подписка

### 1.3 Исправить AdminStatusCount
- Подписан на оба selection стора → ререндерится при каждом движении мыши в любой таблице
- Не обёрнут в `memo()`
- Решение: подписываться только на активный стор через `activeTableId`, обернуть в memo

### 1.4 Исправить подписки на объекты
- `AdminEmployeeNameCell` — `useAdminStore(state => state.employeeById[empId])` возвращает объект → ререндер при любом изменении employeeById
- `DepartmentSettingsModal` — `useAdminStore(s => s.employeeById)` и `useAdminStore(s => s.employeeIds)` без `Object.is`

---

## Фаза 2: Удаление мёртвого кода ✅

### 2.1 Удалить пустые файлы
- `src/services/api.js` — пустой, заменён fetchWebStore/postWebStore
- `src/utils/scheduleHelpers.js` — пустой, нигде не используется

### 2.2 Удалить legacy код
- `src/utils/dateHelpers.js` — `getDateRange()` не используется, логика в `dateIndex.js`
- `src/store/dateStore.jsx` — просто re-export из dateUserStore, заменить импорты на прямые

### 2.3 Удалить закомментированный WebSocket код
- `src/store/scheduleStore.jsx` (строки 22-24, 240-242) — `ws`, `isConnected`, комментарии
- `src/store/workspaceStore.jsx` (строка 41-42) — закомментированный `subscribeToUpdates`

---

## Фаза 3: Разбить adminStore (839 строк → 4-5 файлов) ✅

### 3.1 Выделить adminAuthStore (~60 строк)
**Состояние:** `isAuthenticated`, `user`, `ownedDepartments`, `editableDepartments`
**Экшны:** `login()`, `logout()`, `canEditDepartment()`, `isOwner()`
- Persist middleware остаётся здесь

### 3.2 Выделить hoursStore (~100 строк)
**Состояние:** `hoursSummary`, `codeToHours`, `monthNorms`, `showQuarterSummary`
**Экшны:** `recalcHoursSummary()`, `refreshCodeToHours()`, `toggleQuarterSummary()`
- Дельта-обновления вызываются из draftStore

### 3.3 Оставить draftStore (основной, ~500 строк)
**Состояние:** `draftSchedule`, `originalSchedule`, `employeeIds`, `employeeById`, `undoStack`, `hasUnsavedChanges`, `editingYear`, `editingDepartmentId`, `isAdminMode`, `isCreatingNewYear`, `lastDraftSaved`
**Версионирование:** `baseVersion`, `changedCells`, `prodVersion`
**Годы:** `availableYears`, `loadingYears`
**Экшны:** все CRUD операции с draft, undo, publish, years

### 3.4 Вынести оркестрацию
- `enterAdminContext()` — вынести в `services/adminOrchestrator.js`
- Стор не должен вызывать 6 других сторов последовательно
- Оркестратор координирует загрузку, сторы просто принимают данные

---

## Фаза 4: Добавить memo где отсутствует ✅

### 4.1 Компоненты таблицы
- `AdminMonthHeaders` — без memo, ререндерится при смене showQuarterSummary
- `AdminDaySlots` — без memo
- `MonthHeaders` (user) — без memo
- `DaySlots` (user) — без memo

### 4.2 Компонент AdminStatusCount
- Обернуть в memo после исправления подписок (Фаза 1.3)

---

## Фаза 5: CSS — вынести inline стили в модули

### 5.1 Создать CSS модули для компонентов с тяжёлым inline
- `AdminStaticComponents/Settings/` — StatusesTab, EmployeesTab, AddEmployeeForm → `Settings.module.css`
- `AdminStaticComponents/DepartmentSettingsModal.jsx` → `Modal.module.css`
- `AdminStaticComponents/YearSettingsModal.jsx` → использовать тот же `Modal.module.css`
- `AdminStaticComponents/Buttons/` — стили кнопок → `AdminButtons.module.css`
- `QuarterSummaryCell.jsx` — `cellStyle` → в `Table.module.css`
- `AdminMonthHeaders`, `AdminDaySlots` — `summaryHeaderStyle`, `subHeaderStyle` → в `Table.module.css`

### 5.2 Компоненты Views
- `AdminView.jsx` — inline стили toolbar → CSS модуль
- `UserView.jsx` — если есть inline стили

### 5.3 Итого: ~58 inline стилей в 30 файлах → 4-5 CSS модулей

---

## Фаза 6: DevTools для сторов

### 6.1 Добавить devtools middleware
Сейчас только `versionsStore` имеет devtools. Добавить в:
- adminStore (или его части после разбиения)
- scheduleStore
- dateUserStore
- dateAdminStore
- metaStore
- workspaceStore
- selection stores (через фабрику)

---

## Фаза 7: Данные

### 7.1 Исправить опечатку `descriptin` → `description`
- `public/departments-config-dept-1.json` — 14 вхождений
- `public/departments-config-dept-4.json` — 14 вхождений
- Обновить код который читает это поле (если есть)

---

## Порядок выполнения

| Приоритет | Фаза | Время | Эффект |
|-----------|-------|-------|--------|
| 1 | Фаза 1 — Баги рендеринга | ~1 час | Производительность |
| 2 | Фаза 2 — Мёртвый код | ~30 мин | Чистота |
| 3 | Фаза 3 — Разбить adminStore | ~2-3 часа | Архитектура |
| 4 | Фаза 4 — memo | ~30 мин | Производительность |
| 5 | Фаза 5 — CSS модули | ~2-3 часа | Чистота |
| 6 | Фаза 6 — DevTools | ~30 мин | Отладка |
| 7 | Фаза 7 — Данные | ~15 мин | Чистота |

**Общее время: ~7-9 часов работы**
