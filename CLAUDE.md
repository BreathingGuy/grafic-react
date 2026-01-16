# CLAUDE.md

**Система управления расписанием сотрудников**
React 19.2 + Vite 7.2 + Zustand 5.0

---

## Обзор проекта

Приложение для просмотра и редактирования рабочих графиков по отделам.

**Основные возможности:**
- Просмотр расписания по отделам с выбором периода (7 дней, месяц, квартал, год)
- Админ-режим с drag-выделением, copy/paste, undo
- Кэширование данных по годам
- Система слотов для оптимизации рендеринга

**Статусы ячеек:**
- `Д` — рабочий день (working)
- `В` — выходной (dayoff)
- `У` — учёба (study)
- `О/ОВ` — отпуск (vacation)
- `Н1/Н2` — ночная смена (night)
- `ЭУ` — дополнительные часы (extra)

---

## Структура проекта

```
src/
├── components/
│   ├── Selectors/              # Выбор отдела и периода
│   │   ├── DepartmentSelector.jsx
│   │   └── PeriodSelector.jsx
│   ├── Controls/
│   │   └── TableNavigation.jsx
│   └── Table/                  # Таблица расписания
│       ├── UserTable.jsx       # Таблица просмотра
│       ├── AdminConsole.jsx    # Таблица редактирования
│       ├── TableHeader.jsx
│       ├── SelectionOverlay.jsx
│       ├── Table.module.css
│       ├── Cells/              # Ячейки таблицы
│       │   ├── ViewScheduleCell.jsx
│       │   ├── AdminScheduleCell.jsx
│       │   └── CellEditor.jsx
│       ├── Rows/
│       │   └── AdminEmployeeRow.jsx
│       ├── Static/             # Фиксированная колонка
│       │   ├── FixedEmployeeColumn.jsx
│       │   └── EmployeeNameCell.jsx
│       └── Scrollable/         # Прокручиваемая часть
│           ├── ScrollableUserTable.jsx
│           ├── AdminScrollableScheduleTable.jsx
│           ├── EmployeeRow.jsx
│           ├── MonthHeaders.jsx
│           ├── DaySlots.jsx
│           └── DatingComps.jsx
├── store/                      # Zustand stores
│   ├── scheduleStore.jsx       # Расписание и кэш
│   ├── adminStore.jsx          # Авторизация и draft
│   ├── dateStore.jsx           # Навигация по датам
│   ├── selectionStore.jsx      # Выделение ячеек
│   ├── workspaceStore.jsx      # Текущий отдел
│   ├── metaStore.jsx           # Список отделов, конфиги
│   └── fetchWebStore.jsx
├── hooks/
│   └── useKeyboardShortcuts.jsx
├── services/
│   └── api.js
├── utils/
│   ├── dateHelpers.js
│   ├── scheduleHelpers.js
│   └── normalize.js
├── constants/
│   └── index.js                # MONTHS, STATUS_COLORS
├── App.jsx
├── main.jsx
└── index.css
```

---

## Архитектура

### Stores (Zustand)

**scheduleStore** — данные расписания
- `scheduleMap` — `{ "empId-YYYY-MM-DD": "status" }`
- `employeeById` — `{ id: { id, name, fullName, position } }`
- `employeeIds` — порядок сотрудников
- `cachedYears` — кэш загруженных годов
- Буферы: ±7 дней на стыке годов

**dateStore** — навигация по датам
- Предвычисленные индексы: `datesByYear`, `datesByMonth`, `datesByQuarter`
- Система слотов: `slotToDate`, `slotToDay` (O(1) доступ)
- `visibleSlots` — фиксированный массив [0..365]
- Периоды: `7days`, `1month`, `3months`, `1year`

**adminStore** — редактирование
- `draftSchedule` — рабочая копия
- `undoStack` — история для Ctrl+Z
- `hasUnsavedChanges`
- persist middleware для авторизации

**selectionStore** — выделение ячеек
- `startCell`, `endCell` — текущее выделение
- `selections` — дополнительные выделения (Ctrl+click)
- `isDragging`

**workspaceStore** — рабочее пространство
- `currentDepartmentId`
- Координирует загрузку данных при смене отдела

**metaStore** — метаданные
- `departmentsList`
- `currentDepartmentConfig`

### Паттерны

**Система слотов:**
```jsx
// Вместо перегенерации массивов дат при навигации —
// меняем только маппинг slotToDate
slotToDate[0] = "2025-01-01"
slotToDate[1] = "2025-01-02"
// visibleSlots = [0, 1, 2, ...] — никогда не меняется
```

**Ключи ячеек:**
```javascript
const key = `${employeeId}-${date}`;  // "123-2025-01-15"
```

**Импорт stores:**
```jsx
// Правильно — импорт хука
import { useScheduleStore } from './store/scheduleStore';
const data = useScheduleStore(state => state.scheduleMap);

// Для вызова вне React
useScheduleStore.getState().loadSchedule(deptId, year);
```

---

## Разработка

```bash
npm run dev      # Dev server (Vite, порт 5173)
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview build
```

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
- `.jsx` расширение
- devtools middleware
- Именование: `use{Name}Store`

---

## Ключевые особенности

### Кэширование годов

При загрузке года данные сохраняются в `cachedYears`:
```javascript
cachedYears["deptId-2025"] = { scheduleMap, employeeById, employeeIds }
```

При переключении года сначала проверяется кэш.

### Буфер на стыке годов

При загрузке 2025 добавляются:
- Последние 7 дней декабря 2024 (если закэшированы)
- Первые 7 дней января 2026 (если закэшированы)

### Admin режим

1. Переключение кнопкой "Режим админа"
2. `initializeDraft(year)` — копирует production в draft
3. Drag-выделение ячеек
4. Ctrl+C/V для copy/paste
5. Ctrl+Z для undo
6. "Опубликовать" — применяет draft к production

### Навигация

`dateStore.shiftDates('next' | 'prev')` — сдвиг периода.
Проверяет границы через `canGoNext()`, `canGoPrev()`.
В админ-режиме ограничения отключены (`isAdminMode: true`).

---

## Типичные задачи

### Добавить новый статус

1. `src/constants/index.js`:
```javascript
export const STATUS_COLORS = {
  'НовыйСтатус': 'new-class',
  // ...
};
```

2. Добавить стили в CSS

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

---

## Отладка

**Redux DevTools:**
Stores используют devtools middleware — видны как ScheduleStore, DateStore и т.д.

**Проверка состояния:**
```javascript
console.log(useScheduleStore.getState().scheduleMap);
console.log(useDateStore.getState().slotToDate);
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

- `api.js` — пустой, fetch идёт напрямую к JSON файлам в `/public`
- WebSocket код закомментирован в `scheduleStore`
- `adminStore.login()` — заглушка без реального API
