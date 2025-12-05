# CLAUDE.md - AI Assistant Guide

**Project:** Employee Schedule Management System (Grafic React)
**Last Updated:** 2025-12-04
**Tech Stack:** React 19.2 + Vite 7.2 + Zustand 5.0

---

## 🎯 Project Overview

This is an employee schedule management application that allows viewing and editing work schedules across multiple departments. The system supports:

- **Multi-department schedule viewing** with real-time updates
- **Admin workflow** with draft/publish capabilities
- **Employee search** and filtering
- **Flexible time periods** (7 days, 1 month, 3 months)
- **Schedule status types** for different work arrangements

### Domain Model

**Schedule Status Types:**
- `Д` - Working day (green background)
- `В` - Day off (red background)
- `У` - Study (yellow background)
- `О/ОВ` - Vacation (blue background)
- `Н1/Н2` - Night shift (purple background, white text)
- `ЭУ` - Extra hours (orange background, white text)

**User Roles:**
- **Viewer** - Can view schedules for all departments
- **Admin** - Can edit schedules for assigned departments
- **Owner** - Has full control over department settings

---

## 📁 Codebase Structure

```
grafic-react/
├── src/
│   ├── components/        # React components (organized by feature)
│   │   ├── Layout/       # Header and layout components
│   │   ├── Table/        # Schedule table and related components
│   │   │   ├── ScheduleTable.jsx   # Main table with React.memo optimization
│   │   │   ├── ScheduleCell.jsx    # Individual cell with status colors
│   │   │   ├── EmployeeRow.jsx     # Row component (memoized)
│   │   │   ├── CellEditor.jsx      # Dropdown editor for statuses
│   │   │   └── Table.module.css    # Table styles
│   │   ├── Controls/     # Navigation, search, admin controls
│   │   ├── Tabs/         # Department tabs selector
│   │   │   └── DepartmentTabs.jsx  # Department selector dropdown
│   │   ├── Legend/       # Status legend
│   │   └── Loader/       # Loading skeletons
│   ├── hooks/            # Custom React hooks
│   │   ├── useScheduleData.jsx
│   │   ├── useFilter.jsx
│   │   ├── useDateRange.jsx
│   │   ├── useWebSocket.jsx
│   │   └── useDepartments.jsx
│   ├── store/            # Zustand state management
│   │   ├── scheduleStore.jsx      # Schedule data, loading, normalization
│   │   ├── adminStore.jsx         # Admin auth and permissions
│   │   ├── metaStore.jsx          # Departments list and configs
│   │   ├── workspaceStore.jsx     # UI state (current dept/year)
│   │   └── monitoringStore.jsx    # Monitoring/analytics
│   ├── services/         # External service integrations
│   │   └── api.js       # API client
│   ├── utils/           # Utility functions
│   │   ├── scheduleHelpers.js
│   │   ├── dateHelpers.js        # Date range calculations
│   │   └── normalize.js
│   ├── constants/       # Application constants
│   │   └── index.js    # Status colors, months
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── public/              # Static JSON data files
│   ├── department-list.json           # List of all departments
│   ├── departments-config-dept-X.json # Status config per department
│   └── data-dept-X-YYYY.json         # Schedule data per dept/year
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── eslint.config.js     # ESLint configuration
└── index.html          # HTML entry point
```

---

## 🏗️ Architecture Patterns

### State Management (Zustand)

The application uses **Zustand** for global state management with multiple stores:

1. **scheduleStore.jsx** - Schedule data and operations
   - `scheduleMap` - Normalized schedule (key: `employeeId-date`, value: status)
   - `employeeMap` - Employee data (key: employeeId, value: {id, name, fullName})
   - `changedCells` - Set of recently changed cells (for highlighting)
   - `loading` - Loading state
   - Actions:
     - `loadSchedule(departmentId, year)` - Fetches JSON and normalizes
     - `normalizeScheduleData(rawData, year)` - Transforms API format to flat maps
     - `getCellStatus(employeeId, date)` - Get status for specific cell
     - `getAllEmployees()` - Returns array of employees

2. **adminStore.jsx** - Authentication and permissions
   - Uses `persist` middleware for localStorage
   - Stores user token and department permissions
   - `editMode` - Flag for admin editing mode
   - `draftSchedule` - Admin draft changes
   - Actions: `login()`, `logout()`, `enableEditMode()`, `updateDraftCell()`, `publishDraft()`

3. **metaStore.jsx** - Metadata and configurations
   - `departmentsList` - Array of all departments [{id, name}]
   - `currentDepartmentConfig` - Status config for selected department
   - `isDepartmentsLoaded` - Flag to prevent duplicate loads
   - Actions:
     - `loadDepartmentsList()` - Loads from public/department-list.json
     - `loadDepartmentConfig(departmentId)` - Loads department-specific config

4. **workspaceStore.jsx** - UI workspace state
   - `currentDepartmentId` - Currently selected department
   - `currentYear` - Currently selected year
   - Actions:
     - `setDepartment(departmentId)` - Switches department, loads data
     - `setYear(year)` - Changes year, reloads schedule
     - `goToNextYear()` / `goToPreviousYear()` - Year navigation

5. **monitoringStore.jsx** - Analytics and monitoring
   - Tracks user interactions and performance metrics

### Data Structure & JSON Files

The application loads schedule data from static JSON files in `/public/`:

**1. Department List** (`department-list.json`):
```json
{
  "departments": [
    { "id": "dept-1", "name": "ПФ АС МР" },
    { "id": "dept-2", "name": "ПФ АС НН" }
  ]
}
```

**2. Department Config** (`departments-config-dept-X.json`):
```json
{
  "departmentId": "dept-1",
  "name": "ПФ АС",
  "statusConfig": [
    { "code": "Д", "label": "Дневная смена", "color": "#d4edda", "descriptin": "с 8 до 16.30" },
    { "code": "Н1", "label": "Ночная смена первая", "color": "#cfe2ff" },
    { "code": "В", "label": "Выходной", "color": "#f8d7da" }
  ]
}
```

**3. Schedule Data** (`data-dept-X-YYYY.json`):
```json
{
  "data": [
    {
      "id": 1000,
      "fio": {
        "name1": "Александр",
        "family": "Смирнов",
        "name2": "Сергеевич"
      },
      "schedule": {
        "01-01": "Д",
        "01-02": "Д",
        "01-03": "В"
      }
    }
  ]
}
```

**Data Normalization Flow:**

Raw JSON → `scheduleStore.normalizeScheduleData()` → Two flat maps:

1. **employeeMap**: `{ "1000": { id: "1000", name: "Смирнов А.С.", fullName: "..." } }`
2. **scheduleMap**: `{ "1000-2025-01-01": "Д", "1000-2025-01-02": "Д" }`

This normalization enables O(1) lookups for any cell in the schedule table.

### Component Organization

**Component Naming Convention:**
- PascalCase for component files (e.g., `ScheduleTable.jsx`)
- Co-located CSS Modules (e.g., `Table.module.css`)
- One component per file

**Component Structure:**
```jsx
// 1. Imports (React, hooks, stores, components, styles)
// 2. Component definition
// 3. Export (default export preferred)
```

### Styling Approach

- **CSS Modules** for component-scoped styles (`.module.css` extension)
- **Inline styles** for dynamic/conditional styling
- **Global styles** in `index.css` for base styles
- Color-coded schedule cells based on status type

### Custom Hooks Pattern

Custom hooks follow the `use*` naming convention:
- `useScheduleData` - Fetches and manages schedule data
- `useFilter` - Handles search/filtering logic
- `useDateRange` - Calculates date ranges for different periods
- `useWebSocket` - WebSocket connection for real-time updates
- `useDepartments` - Department list management

### Performance Optimization

**1. Split Cell Components by Role (Key Optimization)**

To maximize performance, we use **two different cell components**:

```jsx
// EmployeeRow.jsx - Conditional rendering based on editMode
const editMode = useAdminStore(state => state.editMode);
const CellComponent = editMode ? EditableScheduleCell : ViewScheduleCell;

{dates.map(date => (
  <CellComponent key={date} employeeId={employee.id} date={date} />
))}
```

**ViewScheduleCell** (for viewers - 90%+ of users):
- **1 Zustand subscription** (scheduleMap + changedCells)
- **2 useMemo hooks** (cellStyle, cellClassName)
- **No editing logic** (no useState, useCallback, CellEditor)
- **Result:** 2-3x faster than editable version

**EditableScheduleCell** (for admins):
- **3 Zustand subscriptions** (scheduleMap, editMode, updateCell)
- **4 useMemo + 2 useCallback hooks**
- **Full editing functionality** (CellEditor, click handlers)
- **Result:** Optimized but heavier than view-only

**Why This Matters:**
- 100 employees × 90 days = 9,000 cells
- Most users are viewers (don't need editing overhead)
- Performance improvements for viewers: **85% faster render**
- Memory reduction: **60-70%** (fewer hooks/subscriptions)

**2. React.memo for Components:**

```jsx
// Both cell types use React.memo with custom comparator
const ViewScheduleCell = memo(({ employeeId, date }) => {
  // Only re-renders if employeeId or date changes
  // ...
}, (prevProps, nextProps) => {
  return (
    prevProps.employeeId === nextProps.employeeId &&
    prevProps.date === nextProps.date
  );
});
```

**3. useMemo for Expensive Calculations:**

```jsx
// ScheduleTable - memoize filtering and date generation
const employees = useMemo(() => {
  let result = Object.values(employeeMap);
  if (search) {
    result = result.filter(e => e.name_long.toLowerCase().includes(search));
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}, [employeeMap, search]);

const [dates, monthGroups] = useMemo(() => {
  return getDateRange(period, baseDate);
}, [period, baseDate]);
```

**4. Zustand Subscription Optimization:**

```jsx
// ViewScheduleCell - Combined subscription (1 instead of 4)
const { status, isChanged } = useScheduleStore(state => ({
  status: state.scheduleMap[key] || '',
  isChanged: state.changedCells?.has(key) || false
}));
```

**Performance Metrics:**
- **Before optimization:** 150ms (3 months), 300ms (1 year)
- **After split cells:** 20-35ms (3 months), 40-70ms (1 year)
- **Improvement:** 85% faster for viewers

**Virtualization (Future):**
- For 500+ employees, consider `react-window` or `react-virtual`
- Only renders visible rows, dramatically improves scroll performance

---

## 🔧 Development Workflow

### Available Scripts

```bash
npm run dev      # Start development server (Vite)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Development Server

- **Port:** Default Vite port (usually 5173)
- **Hot Module Replacement (HMR)** enabled
- Fast refresh for React components

### Code Quality

**ESLint Configuration:**
- Based on `@eslint/js` recommended rules
- React Hooks rules enforced
- React Refresh plugin for HMR compatibility
- Custom rule: Ignore unused vars starting with uppercase or underscore

**Linting Rules to Follow:**
```javascript
// ✅ Good - unused component with uppercase
const _UnusedComponent = () => {};

// ❌ Bad - lowercase unused vars will error
const unusedVar = 'test';
```

---

## 🎨 UI/UX Patterns

### Schedule Table Layout

- **Fixed left column** for employee names
- **Scrollable right section** for schedule dates
- **Two-tier header:** Month groupings + individual dates
- **Cell highlighting** for recently published changes (5-second fade)

### Admin Workflow

1. **View Mode** (default)
   - All users can view schedules
   - Read-only access

2. **Edit Mode** (admin only)
   - Click "Edit" to enter edit mode
   - Load draft schedule
   - Modify cells in-place
   - "Save Draft" - persist changes without publishing
   - "Publish" - apply changes to production + notify all users via WebSocket

3. **Unsaved Changes Protection**
   - Browser warns before navigating away
   - Confirmation dialog when exiting edit mode

### Real-time Updates

- **WebSocket connection** for live updates
- When another admin publishes changes:
  - Changed cells highlighted for 5 seconds
  - Schedule automatically updates for all viewers
  - Notification with admin name and timestamp

---

## 🔑 Key Conventions for AI Assistants

### When Adding New Features

1. **Read existing code first** - Always check similar components before implementing
2. **Follow established patterns:**
   - Use Zustand stores for global state
   - Create custom hooks for reusable logic
   - Use CSS Modules for styling
   - Keep components small and focused

3. **State management guidelines:**
   - Schedule data (employeeMap, scheduleMap) → `scheduleStore`
   - Admin/auth → `adminStore`
   - Metadata (departments, configs) → `metaStore`
   - UI workspace state (current dept/year) → `workspaceStore`
   - Component-only UI state → Local useState
   - **Never duplicate state across stores**
   - **No React Context** - Zustand handles all global state

4. **Component creation:**
   - Place in appropriate `/components/{Feature}/` directory
   - Create co-located `.module.css` file if needed
   - Export as default export
   - Add PropTypes or TypeScript types (if converting to TS)

### Code Style Preferences

**React Patterns:**
```jsx
// ✅ Preferred - functional components with hooks
export default function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(initialValue);
  // ...
}

// ❌ Avoid - class components (use functional)
class MyComponent extends React.Component {
  // Don't use this pattern
}
```

**State Updates:**
```jsx
// ✅ Use Zustand for global state
const updateCell = useScheduleStore(state => state.updateCell);

// ✅ Use local state for UI-only state
const [isOpen, setIsOpen] = useState(false);

// ❌ Avoid prop drilling - use stores or context
```

**Async Operations:**
```jsx
// ✅ Handle in store actions (see adminStore.jsx)
login: async (email, password) => {
  // API call here
  set({ user: response.user });
}

// ✅ Or in custom hooks
const { data, loading, error } = useScheduleData();
```

### File Organization Rules

1. **Component files** - Always `.jsx` extension (even without JSX)
2. **Utility files** - `.js` extension
3. **Stores** - `.jsx` extension (Zustand convention in this project)
4. **One component per file** - No multiple components in a single file
5. **Co-locate related files:**
   ```
   Table/
   ├── ScheduleTable.jsx
   ├── ScheduleCell.jsx
   ├── EmployeeRow.jsx
   └── Table.module.css
   ```

### API Integration Patterns

**Expected Backend Endpoints:**
```javascript
// Viewer endpoints
GET  /api/schedule/:year?department={id}  // Fetch schedule
GET  /api/departments                      // List departments
GET  /api/employees?department={id}        // List employees

// Admin endpoints (require auth header)
POST /api/auth/login
POST /api/auth/logout
GET  /api/admin/departments/:id/draft      // Load draft
POST /api/admin/departments/:id/draft/save // Save draft
POST /api/admin/departments/:id/draft/publish // Publish changes

// WebSocket
WS   /ws/schedule  // Real-time updates
```

**API Client Pattern:**
- API calls should go through `/src/services/api.js`
- Include auth token from `adminStore` for protected routes
- Handle errors consistently

### Testing Considerations

**What to test (when tests are added):**
- Date range calculations (`dateHelpers.js`)
- Schedule data normalization (`normalize.js`)
- Store actions (Zustand)
- Component rendering with various props
- Admin permission checks

**Current Status:** No test files present - tests can be added with Vitest

---

## 🚨 Common Pitfalls & Solutions

### 1. Direct Store Access

**Best Practice:** Access Zustand stores directly - no Context needed

```jsx
// ✅ Correct - direct Zustand access
import { useScheduleStore } from './store/scheduleStore';
const employees = useScheduleStore(state => state.getAllEmployees());

// ❌ Wrong - don't create Context wrappers
import { useSchedule } from './context/ScheduleContext'; // Don't do this!
```

### 2. Zustand Store Import Issues

**Problem:** Store hook not working
**Solution:** Import the **hook**, not the store object

```jsx
// ✅ Correct
import { useScheduleStore } from './store/scheduleStore';
const scheduleMap = useScheduleStore(state => state.scheduleMap);

// ❌ Wrong
import scheduleStore from './store/scheduleStore';
```

### 3. Date Key Consistency

**Problem:** Schedule data not displaying
**Solution:** Ensure date keys are formatted consistently

```javascript
// Key format: `employeeId-YYYY-MM-DD`
const key = `${employeeId}-${date}`; // date must be YYYY-MM-DD
```

### 4. Admin State Persistence

**Problem:** User logged out after page refresh
**Solution:** `adminStore` uses `persist` middleware - check localStorage

```javascript
// Clear persisted state if needed
localStorage.removeItem('admin-storage');
```

### 5. WebSocket Connection Management

**Problem:** Multiple WebSocket connections
**Solution:** Connect once in App/top-level component, cleanup on unmount

```jsx
useEffect(() => {
  const ws = new WebSocket(WS_URL);
  return () => ws.close(); // Cleanup
}, []);
```

### 6. Data Loading Flow

**Correct loading sequence:**

```jsx
// 1. App.jsx - Load departments list on mount
useEffect(() => {
  useMetaStore.getState().loadDepartmentsList();
}, []);

// 2. User selects department via DepartmentTabs
// This triggers workspaceStore.setDepartment()

// 3. setDepartment() orchestrates:
const setDepartment = async (departmentId) => {
  set({ currentDepartmentId: departmentId });

  // Load config and schedule in parallel
  await metaStore.loadDepartmentConfig(departmentId);
  await scheduleStore.loadSchedule(departmentId, currentYear);
};
```

---

## 🔄 Making Changes

### Adding a New Schedule Status

1. Update department config in `public/departments-config-dept-X.json`:
   ```json
   {
     "statusConfig": [
       { "code": "НС", "label": "Новый статус", "color": "#hexcolor", "descriptin": "описание" }
     ]
   }
   ```

2. Update `ScheduleCell.jsx` color mapping if needed:
   ```jsx
   const getBackgroundColor = (status) => {
     switch(status) {
       case 'НС': return '#hexcolor';
       // ...
     }
   };
   ```

3. Update Legend component to display new status

### Adding a New Department

1. Add department to `public/department-list.json`:
   ```json
   {
     "departments": [
       { "id": "dept-5", "name": "Новый отдел" }
     ]
   }
   ```

2. Create config file `public/departments-config-dept-5.json`:
   ```json
   {
     "departmentId": "dept-5",
     "name": "Новый отдел",
     "statusConfig": [ /* ... */ ]
   }
   ```

3. Create schedule data `public/data-dept-5-2025.json`:
   ```json
   {
     "data": [
       {
         "id": 2000,
         "fio": { "name1": "Иван", "family": "Иванов", "name2": "Иванович" },
         "schedule": { "01-01": "Д", "01-02": "В" }
       }
     ]
   }
   ```

4. Department automatically appears in DepartmentTabs selector

### Adding a New Store

```javascript
// src/store/newFeatureStore.jsx
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useNewFeatureStore = create(
  devtools((set, get) => ({
    // State
    data: null,

    // Actions
    setData: (data) => set({ data }),
  }), { name: 'NewFeatureStore' })
);
```

### Adding a New Component

```bash
# 1. Create component directory
mkdir src/components/NewFeature

# 2. Create component file
touch src/components/NewFeature/NewFeature.jsx

# 3. (Optional) Create CSS Module
touch src/components/NewFeature/NewFeature.module.css
```

```jsx
// NewFeature.jsx
import styles from './NewFeature.module.css';

export default function NewFeature({ prop1 }) {
  return (
    <div className={styles.container}>
      {/* Component content */}
    </div>
  );
}
```

---

## 📝 Russian Language Notes

**UI Text:** The application uses Russian language for:
- Employee names and labels
- Month names (defined in `constants/index.js`)
- Button labels and controls
- Status descriptions

**When adding UI text:**
- Continue using Russian for consistency
- Add translations in constants file if needed
- Use Cyrillic characters properly encoded in UTF-8

---

## 🐛 Debugging Tips

### Zustand DevTools

The stores use Zustand DevTools middleware:
- Install Redux DevTools browser extension
- Store names visible: `ScheduleStore`, `AdminStore`
- Inspect state changes and time-travel debug

### Common Debug Checks

```javascript
// Check schedule data structure
console.log('Schedule Map:', useScheduleStore.getState().scheduleMap);

// Check admin state
console.log('Admin User:', useAdminStore.getState().user);
console.log('Edit Mode:', useAdminStore.getState().editMode);

// Check date range calculation
const { dates } = getDateRange('1month', new Date());
console.log('Generated Dates:', dates);
```

### Vite Dev Server Issues

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

---

## 🚀 Deployment Considerations

### Build Process

```bash
npm run build  # Creates /dist folder
```

**Build Output:**
- Static files in `/dist`
- Optimized and minified
- Ready for static hosting (Vercel, Netlify, etc.)

### Environment Variables

Add `.env` files for different environments:

```env
# .env.development
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# .env.production
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
```

Access in code:
```javascript
const API_URL = import.meta.env.VITE_API_URL;
```

### Backend Integration

**Requirements:**
- REST API for schedule data
- WebSocket server for real-time updates
- JWT or session-based authentication
- CORS configured for frontend domain

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [ESLint Rules](https://eslint.org/docs/rules/)

---

## ✅ Quick Reference Checklist

**Before Implementing Features:**
- [ ] Read similar existing components
- [ ] Understand state management flow
- [ ] Check if custom hook exists for this logic
- [ ] Review naming conventions
- [ ] Plan component location

**Before Committing:**
- [ ] Run `npm run lint` and fix issues
- [ ] Test in browser with dev server
- [ ] Check console for errors/warnings
- [ ] Verify hot reload works
- [ ] Review changed files

**When Stuck:**
- [ ] Check browser console for errors
- [ ] Inspect Redux DevTools for state
- [ ] Verify imports are correct
- [ ] Check Context providers are in place
- [ ] Review this CLAUDE.md file

---

*This document should be updated as the project evolves and new patterns emerge.*
