# CLAUDE.md

**Система управления расписанием сотрудников**
React 19.2 + Vite 7.2 + Zustand 5.0

---

## Обзор проекта

Приложение для просмотра и редактирования рабочих графиков по отделам.

**Основные возможности:**
- Просмотр расписания по отделам с выбором периода (7 дней, месяц, квартал, год)
- Админ-режим с drag-выделением, copy/paste, undo
- Версионирование расписаний (draft/production, история версий)
- Две таблицы в админке: основная (год) и offset (сдвиг на 3 месяца, кварталы друг над другом)
- Кэширование данных по годам
- Система слотов для оптимизации рендеринга

**Статусы ячеек:**
- `Д` — дневная смена (working), 8:00–16:30
- `В` — выходной (dayoff)
- `У` — учёба (study)
- `О/ОВ` — отпуск / отпуск в выходной (vacation)
- `Н1` — ночная смена первая (night), 16:00–00:00
- `Н2` — ночная смена вторая (night), 00:00–08:00
- `Э` — эксперт (expert), 9:00–18:00
- `ЭУ` — эксперт утро (extra), 8:00–17:00

---

## Структура проекта

```
src/
├── components/
│   ├── Views/                      # Режимы отображения
│   │   ├── UserView.jsx            # Режим просмотра (селекторы + таблица)
│   │   └── AdminView.jsx           # Режим редактирования (селекторы + консоль)
│   ├── Selectors/                  # Выбор отдела и периода
│   │   ├── DepartmentSelector.jsx  # Селектор отдела (user mode)
│   │   ├── AdminDepartmentSelector.jsx  # Селектор отдела (admin mode)
│   │   ├── PeriodSelector.jsx      # Селектор периода
│   │   └── DepartmentTabs.module.css
│   ├── Controls/
│   │   └── TableNavigation.jsx     # Кнопки навигации (< >)
│   └── Table/                      # Таблица расписания
│       ├── UserTable.jsx           # Таблица просмотра
│       ├── AdminConsole.jsx        # Таблица редактирования
│       ├── AdminInitializer.jsx    # Инициализация admin-контекста
│       ├── TableHeader.jsx
│       ├── SelectionOverlay.jsx    # Визуальное выделение ячеек
│       ├── Table.module.css
│       ├── Cells/                  # Ячейки таблицы
│       │   ├── ViewScheduleCell.jsx
│       │   ├── AdminScheduleCell.jsx
│       │   └── CellEditor.jsx      # Инлайн-редактор ячейки
│       ├── Rows/
│       │   ├── EmployeeRow.jsx     # Строка сотрудника (user)
│       │   └── AdminEmployeeRow.jsx # Строка сотрудника (admin)
│       ├── Static/                 # Фиксированная колонка (имена)
│       │   ├── FixedEmployeeColumn.jsx
│       │   ├── EmployeeNameCell.jsx
│       │   ├── AdminFixedEmployeeColumn.jsx
│       │   └── AdminEmployeeNameCell.jsx
│       ├── Scrollable/             # Прокручиваемая часть
│       │   ├── User/               # Компоненты user-таблицы
│       │   │   ├── ScrollableUserTable.jsx
│       │   │   ├── MonthHeaders.jsx
│       │   │   ├── DaySlots.jsx
│       │   │   └── DatingComps.jsx
│       │   └── Admin/              # Компоненты admin-таблицы
│       │       ├── AdminScrollableScheduleTable.jsx
│       │       ├── MainAdminTable.jsx    # Основная таблица (год)
│       │       ├── OffsetAdminTable.jsx  # Сдвинутая таблица (+3 месяца)
│       │       ├── AdminRows.jsx
│       │       ├── AdminMonthHeaders.jsx
│       │       ├── AdminDaySlots.jsx
│       │       └── AdminDatingComps.jsx
│       ├── AdminStaticComponents/  # Панель управления админки
│       │   ├── AdminHeader.jsx     # Шапка с кнопками
│       │   ├── AdminYearSelector.jsx    # Композиция: год + версия
│       │   ├── Buttons/                 # Изолированные кнопки/селекты
│       │   │   ├── YearSelect.jsx       # Выбор года
│       │   │   ├── CreateYearButton.jsx # Создание нового года
│       │   │   ├── VersionSelect.jsx    # Выбор версии
│       │   │   └── VersionIndicator.jsx # Индикатор readonly-версии
│       │   ├── AdminStatusCount.jsx     # Счётчик статусов
│       │   ├── AdminStatusBar.jsx       # Панель статусов
│       │   └── YearDataLoader.jsx       # Загрузчик данных года
│       └── UserStaticComponents/
│           └── YearDataLoader.jsx       # Загрузчик данных года (user)
├── store/                          # Zustand stores
│   ├── scheduleStore.jsx           # Production-расписание и кэш
│   ├── adminStore.jsx              # Авторизация, draft, версионирование
│   ├── dateStore.jsx               # Re-export из dateUserStore (совместимость)
│   ├── dateUserStore.jsx           # Навигация по датам (user mode)
│   ├── dateAdminStore.jsx          # Навигация по датам (admin mode)
│   ├── workspaceStore.jsx          # Текущий отдел, координация
│   ├── metaStore.jsx               # Список отделов, конфиги
│   ├── versionsStore.jsx           # История версий расписания
│   ├── fetchWebStore.jsx           # Чтение из localStorage (GET)
│   ├── postWebStore.jsx            # Запись в localStorage (POST/PUT)
│   └── selection/                  # Выделение ячеек (фабрика)
│       ├── index.js                # Экспорты
│       ├── createSelectionStore.js # Фабрика selection store
│       ├── mainSelectionStore.jsx  # Выделение в основной таблице
│       ├── offsetSelectionStore.jsx # Выделение в offset-таблице
│       └── clipboardStore.jsx      # Буфер обмена, координация таблиц
├── hooks/
│   └── useKeyboardShortcuts.jsx    # Ctrl+C/V/Z, Escape
├── services/
│   ├── api.js                      # Пустой (заглушка)
│   └── localStorageInit.js         # Инициализация localStorage из JSON
├── utils/
│   ├── dateIndex.js                # Динамическая генерация дат с кэшем
│   ├── dateHelpers.js              # Вспомогательные функции дат (legacy)
│   └── scheduleHelpers.js          # Пустой (заглушка)
├── constants/
│   └── index.js                    # MONTHS, STATUS_COLORS
├── App.jsx                         # Корневой компонент, инициализация
├── main.jsx                        # Точка входа React
└── index.css                       # Глобальные стили
```

---

## База данных / Данные

### Источники данных

Приложение использует **localStorage** как имитацию backend API. При первом запуске данные загружаются из JSON-файлов в `/public/` и нормализуются.

### JSON-файлы в `/public/`

**Конфигурация:**
- `department-list.json` — список отделов: `{ departments: [{ id, name }] }`
- `departments-config-{deptId}.json` — конфиг статусов отдела: `{ statusConfig: [{ code, label, color, descriptin }] }`
- `employees.json` — сотрудники по отделам: `{ "dept-1": { "1000": { id, name, fullName, position } } }`

**Расписание (сырой формат):**
- `data-{deptId}-{year}.json` — расписание отдела за год

```json
{
  "users_id": "1000,1001,...",
  "data": [
    {
      "id": 1000,
      "fio": { "family": "Смирнов", "name1": "Александр", "name2": "Сергеевич" },
      "schedule": { "01-01": "Д", "01-02": "В", ... }
    }
  ]
}
```

**Имеющиеся данные:**
- dept-1 ("ПФ АС МР"): 15 сотрудников (id 1000–1014), годы 2025, 2026
- dept-4 ("ПЛЦР"): 15 сотрудников (id 2000–2014), год 2025
- dept-2 ("ПФ АС НН"), dept-3 ("ПБО"): в списке отделов, но данных нет

### localStorage (нормализованный формат)

Инициализация: `localStorageInit.js` (v3.0). Нормализует `"01-01"` → `"2025-01-01"`.

**Ключи хранения:**
| Ключ | Формат | Описание |
|------|--------|----------|
| `schedule-{dept}-{year}` | `{ scheduleMap, version }` | Production-расписание |
| `draft-schedule-{dept}-{year}` | `{ scheduleMap, baseVersion, changedCells }` | Черновик расписания |
| `employees-{dept}` | `{ employeeById, employeeIds }` | Сотрудники отдела |
| `draft-employees-{dept}` | `{ employeeById, employeeIds }` | Черновик сотрудников |
| `available-years-{dept}` | `["2025", "2026"]` | Доступные годы |
| `versions-{dept}-{year}` | `{ "versionId": { id, scheduleMap, createdAt } }` | Снапшоты версий |

**Нормализованный scheduleMap:**
```javascript
{
  "1000-2025-01-01": "Д",
  "1000-2025-01-02": "В",
  "1001-2025-01-01": "Н1",
  // ...
}
```

### Версионирование

- `version` — номер версии production (1, 2, 3, ...)
- `baseVersion` — версия прода, на основе которой создан черновик
- `changedCells` — ячейки, изменённые в черновике
- При публикации: если `baseVersion === prodVersion` → отправляются только `changedCells`; иначе — весь draft
- При публикации создаётся snapshot версии с id формата `YYYY.MM.DD`

### API-спецификация

Файл `API-user-grafic.txt` содержит спецификацию будущего REST API:
- `GET /api/departments/list` — список отделов
- `GET /api/departments/{id}/config` — конфигурация отдела (с `codeList`/`codeWork`)
- `GET /api/departments/{id}/schedule?year=2025` — расписание с буферами
- `GET /api/employees/except-{deptId}` — сотрудники других отделов
- `GET /api/employees/schedule/:year?ids=[...]` — расписание группы сотрудников

---

## Архитектура

### Поток данных

```
JSON файлы (/public/) → localStorageInit.js → localStorage
                                                    ↓
                              fetchWebStore (чтение) ↔ postWebStore (запись)
                                    ↓                        ↑
                              scheduleStore (production)     |
                              adminStore (draft)  ───────────┘
                                    ↓
                              Components (UserView / AdminView)
```

### Stores (Zustand)

**scheduleStore** — production-расписание (244 строки)
- `scheduleMap` — `{ "empId-YYYY-MM-DD": "status" }`
- `employeeById` — `{ id: { id, name, fullName, position } }`
- `employeeIds` — порядок сотрудников
- `cachedYears` — кэш: `{ "deptId-year": { scheduleMap, employeeById, employeeIds } }`
- `addYearBuffers()` — добавляет ±7 дней из соседних годов
- `applyChanges()` — применяет изменения после публикации (с подсветкой 5 сек)

**adminStore** — draft-редактирование и авторизация (770 строк)
- `draftSchedule` — рабочая копия расписания
- `originalSchedule` — исходное состояние (для сравнения)
- `undoStack` — история для Ctrl+Z (хранит `{ draftSchedule, changedCells }`)
- `baseVersion`, `prodVersion`, `changedCells` — версионирование
- `availableYears` — список доступных годов
- `enterAdminContext(deptId, year)` — единая точка входа
- `publishDraft()` — публикация с версионированием
- `createNewYear(year)` — создание нового года (+ Q1 следующего)
- `loadVersion(version)` / `exitVersionView()` — просмотр истории
- persist middleware — сохраняет только auth-данные

**dateUserStore** — навигация по датам, user mode (266 строк)
- Периоды: `7days`, `1month`, `3months`, `1year`
- Система слотов: `slotToDate`, `slotToDay`, `monthGroups`
- `shiftDates('next' | 'prev')` — навигация с проверкой границ
- `canGoNext()`, `canGoPrev()` — проверки границ

**dateAdminStore** — навигация по датам, admin mode (121 строка)
- Всегда показывает целый год
- Основная таблица: `slotToDate`, `slotToDay`, `monthGroups`
- Offset-таблица (сдвиг +3 месяца): `offsetSlotToDate`, `offsetSlotToDay`, `offsetMonthGroups`
- `initializeYear(year)` — инициализация обеих таблиц

**dateStore** — re-export из dateUserStore (обратная совместимость)

**selection/** — выделение ячеек (фабрика)
- `createSelectionStore()` — фабрика для создания selection store
- `mainSelectionStore` — выделение в основной таблице
- `offsetSelectionStore` — выделение в offset-таблице
- `clipboardStore` — координация таблиц, отслеживание активной таблицы, статус-сообщения

**workspaceStore** — рабочее пространство (80 строк)
- `currentDepartmentId`
- `setDepartment(id)` — для user mode (загружает config + schedule)
- `setAdminDepartment(id)` — для admin mode (через `enterAdminContext`)
- `loadYearData(year)` — загрузка данных при навигации по годам

**metaStore** — метаданные (74 строки)
- `departmentsList` — список отделов
- `currentDepartmentConfig` — конфиг текущего отдела (статусы, цвета)

**fetchWebStore** — чтение данных (400 строк, имитация GET)
- `fetchSchedule(deptId, year, { mode })` — расписание (production/draft с fallback)
- `fetchDepartmentsList()` / `fetchDepartmentConfig(id)` — из JSON-файлов
- `fetchDepartmentEmployees(deptId, { mode })` — сотрудники
- `fetchDepartmentYears(deptId)` — доступные годы
- `fetchYearVersions(deptId, year)` / `fetchVersionSchedule(deptId, year, version)`
- Состояния `loading` и `errors` для каждой операции

**postWebStore** — запись данных (347 строк, имитация POST/PUT)
- `publishSchedule(deptId, year, changes)` — публикация (инкремент version, создание snapshot)
- `createScheduleYear(deptId, year, scheduleMap)` — создание нового года
- `saveDraftSchedule()` / `deleteDraftSchedule()` — управление черновиками
- `saveDraftEmployees()` / `deleteDraftEmployees()`
- `createVersion(deptId, year, versionId, scheduleMap)` — snapshot версии

**versionsStore** — история версий (66 строк)
- `yearVersions` — список версий для текущего года
- `selectedVersion` — выбранная для просмотра версия
- Изолирован от adminStore чтобы не триггерить лишние ре-рендеры

### Паттерны

**Система слотов:**
```jsx
// Фиксированный массив индексов [0..365] — никогда не меняется
VISIBLE_SLOTS = [0, 1, 2, ...]
// Меняется только маппинг:
slotToDate[0] = "2025-01-01"
slotToDate[1] = "2025-01-02"
```

**Ключи ячеек:**
```javascript
const key = `${employeeId}-${date}`;  // "1000-2025-01-15"
```

**Импорт stores:**
```jsx
// В React-компонентах — через selector
import { useScheduleStore } from './store/scheduleStore';
const data = useScheduleStore(state => state.scheduleMap);

// Вне React (в других stores, обработчиках)
useScheduleStore.getState().loadSchedule(deptId, year);
```

**Фабрика selection stores:**
```javascript
// createSelectionStore() создаёт идентичные store для main и offset таблиц
import { createSelectionStore } from './createSelectionStore';
export const useMainSelectionStore = createSelectionStore();
export const useOffsetSelectionStore = createSelectionStore();
```

---

## Разработка

```bash
npm run dev      # Dev server (Vite, порт 5173)
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview build
```

### Зависимости

**Runtime:** react 19.2, react-dom 19.2, zustand 5.0, use-debounce 10.0
**Dev:** vite 7.2, @vitejs/plugin-react 5.1, eslint 9.39

### Соглашения

**Компоненты:**
- Functional components + hooks
- PascalCase для файлов
- CSS Modules (`.module.css`)
- Один компонент на файл

**Стили:**
- CSS Modules для компонентов
- Inline styles для динамических стилей
- Глобальные стили в `index.css`

**Stores:**
- `.jsx` расширение (`.js` для фабрик)
- Именование: `use{Name}Store`
- devtools middleware (не во всех stores)
- persist middleware только для auth в adminStore

---

## Ключевые особенности

### Кэширование годов

При загрузке года данные сохраняются в `cachedYears`:
```javascript
cachedYears["dept-1-2025"] = { scheduleMap, employeeById, employeeIds }
```

При переключении года сначала проверяется кэш. Оптимизация: объекты сотрудников переиспользуются если данные не изменились.

### Динамическая генерация дат

**Индекс дат** (`utils/dateIndex.js`):
- Генерация дат по запросу (`generateYearDates`)
- Кэшируются: `datesByYear`, `datesByMonth`, `datesByQuarter`, `dateDays`
- При инициализации предзагружается текущий год + 5 лет вперед
- Экспорт: `getYearDates`, `getQuarterDates`, `getMonthDates`, `getWeekDates`, `getYearDatesWithOffset`

```javascript
const dates = getYearDates(2027);                    // Генерирует автоматически
const offsetDates = getYearDatesWithOffset(2025, 3);  // Год со сдвигом на 3 месяца
preloadYears(2025, 2030);                             // Предзагрузка
```

### Буфер на стыке годов

При загрузке 2025 добавляются:
- Последние 7 дней декабря 2024 (если закэшированы)
- Первые 7 дней января 2026 (если закэшированы)

### Admin-режим

**Вход:** кнопка "Режим админа" → `App.jsx` переключает `UserView ↔ AdminView`

**Инициализация:**
1. `AdminInitializer` загружает `availableYears` и вызывает `enterAdminContext`
2. `enterAdminContext(deptId, year)` — единая точка входа:
   - Очищает выделения (`clipboardStore`)
   - Сбрасывает версии (`versionsStore`)
   - Инициализирует даты (`dateAdminStore`)
   - Загружает draft (`initializeDraft`)

**Редактирование:**
- Drag-выделение ячеек (main и offset таблицы)
- Ctrl+C/V — copy/paste (через `useKeyboardShortcuts`)
- Ctrl+Z — undo (стек состояний draft + changedCells)
- Escape — сброс выделения
- Вставка поддерживает тайлинг: если выделение кратно буферу, данные размножаются

**Публикация:**
- "Опубликовать" → `publishDraft()` → `postWebStore.publishSchedule()` → обновляет production + создаёт snapshot

**Создание новых годов:**
- Кнопка "+ Новый год" → `createNewYear(max+1)`
- Генерирует пустые ячейки для всех сотрудников
- Включает Q1 следующего года для offset-таблицы
- Сохраняет через `postWebStore.createScheduleYear()`

**Просмотр версий:**
- `loadVersion(version)` — загружает snapshot как readonly draft
- `exitVersionView()` — возврат к текущему draft

### Offset-таблица (admin)

Вторая таблица сдвинута на 3 месяца вперёд (апрель–март следующего года). Позволяет видеть кварталы «один над другим» для удобства сравнения. Использует отдельный `offsetSelectionStore`.

### Навигация

**User mode:** `dateUserStore.shiftDates('next' | 'prev')` — сдвиг по периоду с проверкой границ.
**Admin mode:** `dateAdminStore` — переключение целых годов через `initializeYear(year)`.

---

## Типичные задачи

### Добавить новый статус

1. `src/constants/index.js` — добавить в `STATUS_COLORS`
2. `public/departments-config-{deptId}.json` — добавить в `statusConfig`
3. Добавить CSS-класс для цвета

### Добавить новый store

```javascript
// src/store/newStore.jsx
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useNewStore = create(
  devtools((set, get) => ({
    data: null,
    setData: (data) => set({ data }),
  }), { name: 'NewStore' })
);
```

### Добавить компонент

```jsx
// src/components/Feature/Feature.jsx
import styles from './Feature.module.css';

export default function Feature({ prop }) {
  return <div className={styles.container}>{prop}</div>;
}
```

### Добавить новый отдел

1. `public/department-list.json` — добавить `{ id, name }`
2. `public/departments-config-{id}.json` — конфиг статусов
3. `public/employees.json` — добавить секцию с сотрудниками
4. `public/data-{id}-{year}.json` — расписание
5. `localStorageInit.js` → `DATA_FILES` — добавить запись

---

## Отладка

**Redux DevTools:**
Stores с devtools middleware видны как VersionsStore и др. Не все stores используют devtools.

**Проверка состояния:**
```javascript
console.log(useScheduleStore.getState().scheduleMap);
console.log(useDateUserStore.getState().slotToDate);
console.log(useAdminStore.getState().changedCells);
```

**Информация о хранилище:**
```javascript
import { getStorageInfo } from './services/localStorageInit';
console.log(getStorageInfo());  // { totalKeys, sizeKB, schedules, draftSchedules, ... }
```

**Сброс localStorage:**
```javascript
import { clearAppStorage } from './services/localStorageInit';
clearAppStorage();  // Удаляет все ключи приложения
// После перезагрузки страницы данные заново инициализируются из JSON
```

**Очистка кэша Vite:**
```bash
rm -rf node_modules/.vite && npm run dev
```

---

## Локализация

Интерфейс на русском языке. Месяцы определены в `constants/index.js`:
```javascript
export const MONTHS = ["январь", "февраль", ...];
```

---

## TODO / Заглушки

- `api.js` — пустой, заменён на `fetchWebStore` + `postWebStore` (localStorage)
- `scheduleHelpers.js` — пустой
- WebSocket код закомментирован в `scheduleStore` и `metaStore`
- `adminStore.login()` — заглушка без реального API
- `dateHelpers.js` — legacy-функция `getDateRange`, основная логика в `dateIndex.js`
- API-спецификация описана в `API-user-grafic.txt`, но не реализована (используется localStorage)
- Конфиг `departments-config-dept-4.json` содержит `departmentId: "dept-1"` вместо `"dept-4"` (баг в данных)
- Поле `descriptin` в конфигах — опечатка (должно быть `description`)
