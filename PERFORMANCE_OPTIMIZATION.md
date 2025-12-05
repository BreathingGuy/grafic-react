# Performance Optimization Guide

## Current Performance Issues

### 3 месяца (90 дней)
- Total render: 150ms
- Per row: 9ms (3.8ms row + cells)
- Per cell: 0.2ms

### 1 год (365 дней)
- Total render: 300ms
- Per row: 14.9ms (variance 1.3-6.5ms)
- Per cell: 0.1ms

## Optimization Strategy: Split Cell Components

**Key Insight:** 90%+ users are viewers, not admins. They don't need editing logic!

### Solution: Conditional Rendering by Role

**ViewScheduleCell** (for non-admin users):
- 1 Zustand subscription (instead of 3)
- 2 useMemo hooks (instead of 4)
- No useState, useCallback
- No CellEditor import
- **2-3x faster than EditableScheduleCell**

**EditableScheduleCell** (for admin users):
- 3 Zustand subscriptions
- 4 useMemo, 2 useCallback hooks
- Full editing functionality
- CellEditor support

**EmployeeRow** receives CellComponent from ScheduleTable:
```jsx
// ScheduleTable determines CellComponent once
const editMode = useAdminStore(state => state.editMode);
const CellComponent = editMode ? EditableScheduleCell : ViewScheduleCell;

// Pass to all rows
<EmployeeRow CellComponent={CellComponent} ... />
```

## Identified Bottlenecks

### 1. Multiple Zustand Subscriptions per Cell

**Current:**
```jsx
const status = useScheduleStore(...)     // Subscription #1
const isChanged = useScheduleStore(...)  // Subscription #2
const updateCell = useScheduleStore(...) // Subscription #3
const editMode = useAdminStore(...)      // Subscription #4
```

**Problem:** 100 employees × 90 days = 9,000 cells = **36,000 subscriptions**

**Solution:** Combine into single subscription
```jsx
const { status, isChanged } = useScheduleStore(state => {
  const key = `${employeeId}-${date}`;
  const editMode = useAdminStore.getState().editMode;

  return {
    status: editMode && state.draftSchedule?.[key] !== undefined
      ? state.draftSchedule[key]
      : state.scheduleMap[key] || '',
    isChanged: state.changedCells?.has(key) || false
  };
});
```

### 2. Redundant String Creation

**Current:**
```jsx
// Key created twice per render
`${employeeId}-${date}` // In status selector
`${employeeId}-${date}` // In isChanged selector
```

**Solution:** Memoize the key
```jsx
const key = useMemo(() => `${employeeId}-${date}`, [employeeId, date]);
```

### 3. Function/Object Recreation on Every Render

**Current:**
```jsx
const getBackgroundColor = (status) => { ... } // Created every render
const getTextColor = (status) => { ... }       // Created every render
const cellStyle = { ... }                      // Object created every render
```

**Solution:** Move functions outside component + memoize style object
```jsx
// Outside component (only created once)
const getBackgroundColor = (status) => { ... }
const getTextColor = (status) => { ... }

// Inside component
const cellStyle = useMemo(() => ({
  backgroundColor: getBackgroundColor(status),
  color: getTextColor(status),
  cursor: editMode ? 'pointer' : 'default',
  opacity: editMode && !isEditing ? 0.9 : 1,
}), [status, editMode, isEditing]);
```

### 4. Template Literal Overhead

**Current:**
```jsx
className={`${styles.scheduleCell} ${isChanged ? styles.changed : ''}`}
```

**Solution:** Precompute or use clsx library
```jsx
const className = useMemo(() =>
  isChanged
    ? `${styles.scheduleCell} ${styles.changed}`
    : styles.scheduleCell,
  [isChanged]
);
```

### 5. Event Handler Recreation

**Current:**
```jsx
const handleClick = () => {
  if (editMode) setIsEditing(true);
};
```

**Solution:** useCallback
```jsx
const handleClick = useCallback(() => {
  if (editMode) setIsEditing(true);
}, [editMode]);
```

## Expected Improvements

### Phase 1: Combined Subscriptions + Memoization
- **50-70% reduction** in render time
- **75% reduction** in Zustand subscriptions (36,000 → ~11,000)
- **Faster initial mount** (less work during mount)
- **Better memory usage** (fewer closures/subscriptions)

Target performance:
- 3 months: 150ms → **50-75ms**
- 1 year: 300ms → **100-150ms**
- Per cell: 0.2ms → **0.05-0.1ms**

### Phase 2: Split Cell Components (ViewScheduleCell + EditableScheduleCell)

**For viewers (90%+ of users):**
- **Additional 60-70% improvement** over Phase 1
- ViewScheduleCell has minimal overhead:
  - 1 subscription vs 3 (67% reduction)
  - 2 useMemo vs 4 (50% reduction)
  - No useState, useCallback (eliminating closure overhead)

**Combined improvements for viewers:**
- 3 months: 150ms → **20-35ms** (85% faster)
- 1 year: 300ms → **40-70ms** (85% faster)
- Per cell: 0.2ms → **0.02-0.04ms** (90% faster)

**For admins:**
- Performance remains at Phase 1 levels (still 50-70% improvement)
- Full editing functionality preserved

**Memory benefits:**
- 90% of cells use ViewScheduleCell (lightweight)
- Only admin cells have editing overhead
- Estimated memory reduction: **60-70%** for viewer sessions

### Phase 3: EmployeeRow Subscription Optimization

**Problem identified:** Each EmployeeRow subscribed to `editMode` separately:
- 100 employees = 100 `useAdminStore` subscriptions
- Every row checked `editMode` on every render
- Row render time: **13-17ms per row** (from profiling)

**Solution:** Move `editMode` subscription to ScheduleTable:

```jsx
// ScheduleTable.jsx (1 subscription for all rows)
const editMode = useAdminStore(state => state.editMode);
const CellComponent = editMode ? EditableScheduleCell : ViewScheduleCell;

// Pass to all rows
<EmployeeRow CellComponent={CellComponent} ... />

// EmployeeRow.jsx (no subscription)
const EmployeeRow = memo(({ employee, dates, CellComponent }) => {
  // No useAdminStore here! Just render cells
  return <tr>{dates.map(date => <CellComponent ... />)}</tr>
});
```

**Results:**
- 100 subscriptions → **1 subscription** (99% reduction)
- Row render: 13-17ms → **Expected 4-7ms** (50-70% faster)
- Cleaner component hierarchy
- Rows only re-render when their data actually changes

**Total improvements (Phase 1 + 2 + 3):**
- ScheduleTable overall: 34-36ms → **Expected 15-20ms** (40-45% faster)
- EmployeeRow: Much faster, no unnecessary re-renders from editMode checks
- ViewScheduleCell: Already optimal (2-3x faster than editable)
- Combined: **~90% faster overall** for viewers vs original implementation
