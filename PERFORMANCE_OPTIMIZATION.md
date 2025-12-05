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

After optimizations:
- **50-70% reduction** in render time
- **90% reduction** in Zustand subscriptions (36,000 → ~11,000)
- **Faster initial mount** (less work during mount)
- **Better memory usage** (fewer closures/subscriptions)

Target performance:
- 3 months: 150ms → **50-75ms**
- 1 year: 300ms → **100-150ms**
- Per cell: 0.2ms → **0.05-0.1ms**
