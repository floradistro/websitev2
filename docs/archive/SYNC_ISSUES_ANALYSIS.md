# 🔍 Editor Sync Issues - Root Cause Analysis

## The Problem

**User reports:** Properties panel is glitchy, not in sync

### Symptoms:
1. Click component → Properties don't update
2. Edit props → Preview doesn't update
3. Panels out of sync
4. Glitchy/jumpy behavior

---

## Data Flow Audit

### Current Flow:
```
1. User clicks component in iframe preview
   ↓
2. Preview sends postMessage('COMPONENT_SELECTED', {componentId})
   ↓
3. Editor receives message
   ↓
4. Editor updates selectedComponent state
   ↓
5. Properties panel re-renders
   ↓
6. User edits props
   ↓
7. updateComponent() called
   ↓
8. Editor sends postMessage('UPDATE_COMPONENT', {updates})
   ↓
9. Preview receives and updates
```

### Issues in Flow:
- ⚠️ Race condition: Preview loads async
- ⚠️ State updates async
- ⚠️ Multiple re-renders
- ⚠️ No debouncing on prop edits
- ⚠️ Components state separate from selectedComponent state

---

## Root Causes Identified

### 1. **State Desync**
```typescript
// Problem: Two sources of truth
const [components, setComponents] = useState([]);
const [selectedComponent, setSelectedComponent] = useState(null);

// When component updated:
updateComponent(id, updates) {
  // Updates components array ✅
  setComponents(prev => prev.map(...));
  
  // But selectedComponent might be stale! ❌
  setSelectedComponent({ ...selectedComponent, ...updates });
}
```

### 2. **No Debouncing**
```typescript
// Every keystroke sends update
onChange={(e) => handlePropChange('headline', e.target.value)}
// ❌ 10 keystrokes = 10 postMessages = 10 iframe re-renders
```

### 3. **Preview Load Race**
```typescript
// Editor loads → Tries to send selection
// But iframe not loaded yet!
// Message lost, selection fails
```

### 4. **Component Instance Mismatch**
```typescript
// Editor has component ID "abc123"
// Preview loaded with different data
// IDs don't match
// Selection fails
```

---

## Solutions

### Fix 1: Single Source of Truth
```typescript
// Don't store selectedComponent separately
const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

// Derive from components array
const selectedComponent = components.find(c => c.id === selectedComponentId);
```

### Fix 2: Debounced Updates
```typescript
const debouncedUpdate = useMemo(
  () => debounce((componentId, updates) => {
    // Send to preview
    previewRef.current?.contentWindow?.postMessage({
      type: 'UPDATE_COMPONENT',
      payload: { componentId, updates }
    }, '*');
  }, 300),
  []
);
```

### Fix 3: Wait for Preview Ready
```typescript
const [previewReady, setPreviewReady] = useState(false);

useEffect(() => {
  const handleMessage = (e) => {
    if (e.data.type === 'PREVIEW_READY') {
      setPreviewReady(true);
    }
  };
  window.addEventListener('message', handleMessage);
}, []);

// Only send selections when preview is ready
if (previewReady) {
  sendSelection(componentId);
}
```

### Fix 4: Sync Component Data on Load
```typescript
// When preview loads, sync its data with editor
useEffect(() => {
  if (previewReady && components.length > 0) {
    previewRef.current?.contentWindow?.postMessage({
      type: 'SYNC_COMPONENTS',
      payload: { components }
    }, '*');
  }
}, [previewReady, components]);
```

---

## Implementation Plan

### Immediate (30 minutes):
1. Fix selectedComponent to be derived state
2. Add preview ready check
3. Add debouncing to prop updates
4. Fix component ID matching

### This Hour:
1. Add optimistic updates
2. Add error recovery
3. Add loading states
4. Test all smart components

---

## Analyzing code now...

