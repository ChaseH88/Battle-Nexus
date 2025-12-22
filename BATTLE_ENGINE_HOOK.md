# BattleEngine React Hook

## Overview

The `useBattleEngine` hook provides a reactive, type-safe interface to the BattleEngine class, solving stale state issues and simplifying game state management in React components.

## The Problem

Previously, `app.tsx` manually managed:
- BattleEngine and AIPlayer instances
- Manual refresh triggers (`refreshTrigger` state)
- AI turn execution in useEffect
- Callback refs to prevent closure issues
- Direct state mutations without React knowing

This led to multiple bugs:
1. **Stale state**: React didn't detect changes to `engine.state.activePlayer`
2. **Race conditions**: AI turns executing multiple times
3. **Reference errors**: Functions accessing variables before declaration
4. **Complex dependencies**: useEffect dependencies constantly changing

## The Solution

`useBattleEngine` encapsulates all BattleEngine state management:

```typescript
const {
  engine,
  gameState,
  currentPlayer,
  opponent,
  isPlayerTurn,
  isAITurn,
  isGameOver,
  winner,
  initializeGame,
  draw,
  playCreature,
  playSupport,
  activateSupport,
  attack,
  toggleCreatureMode,
  endTurn,
  refresh,
} = useBattleEngine();
```

## Key Features

### 1. Version-Based State Management
Uses a `version` counter that increments on every action, triggering React re-renders:

```typescript
const [version, setVersion] = useState(0);
const refresh = useCallback(() => {
  setVersion(v => v + 1);
}, []);
```

### 2. Wrapped Action Methods
All game actions are wrapped to automatically trigger refresh:

```typescript
const draw = useCallback((playerIndex: number) => {
  if (!engine) return;
  engine.draw(playerIndex);
  refresh(); // Auto-refresh after action
}, [engine, refresh]);
```

### 3. Derived State
Provides computed values that are always current:

```typescript
const currentPlayer = gameState ? gameState.players[gameState.activePlayer] : null;
const isPlayerTurn = gameState?.activePlayer === 0;
const isGameOver = gameState?.winnerIndex !== null;
```

### 4. Automatic AI Turn Execution
Built-in AI turn management with proper race condition handling:

```typescript
useEffect(() => {
  if (!engine || !ai) return;
  if (engine.state.winnerIndex !== null) return;
  if (engine.state.activePlayer !== 1) return;
  if (aiTurnInProgressRef.current) return;
  
  const executeAITurn = async () => {
    aiTurnInProgressRef.current = true;
    await ai.takeTurn(engine.state);
    refresh();
    aiTurnInProgressRef.current = false;
  };
  
  setTimeout(executeAITurn, 1000);
}, [engine, ai, version, refresh]);
```

## Usage in Components

### Before (Manual State Management)

```typescript
// app.tsx - OLD WAY
const [engine, setEngine] = useState<BattleEngine | null>(null);
const [ai, setAi] = useState<AIPlayer | null>(null);
const [refreshTrigger, setRefreshTrigger] = useState(0);
const aiTurnInProgressRef = useRef(false);

const refresh = () => setRefreshTrigger(prev => prev + 1);

const handleDraw = () => {
  engine.draw(game.activePlayer);
  refresh(); // Manual refresh required
};

// Complex AI turn logic in useEffect
useEffect(() => {
  // 30+ lines of AI turn management
}, [engine, ai, refreshTrigger]);

const game = engine.state;
const currentPlayer = game.players[game.activePlayer];
const opponent = game.players[game.activePlayer === 0 ? 1 : 0];
```

### After (Hook-Based)

```typescript
// app.tsx - NEW WAY
const {
  engine,
  gameState,
  currentPlayer,
  opponent,
  isPlayerTurn,
  draw,
  endTurn,
} = useBattleEngine();

const handleDraw = () => {
  draw(gameState.activePlayer); // Auto-refreshes
};

// No manual AI logic needed - handled by hook
```

## API Reference

### State Values

| Property | Type | Description |
|----------|------|-------------|
| `engine` | `BattleEngine \| null` | Core game engine instance |
| `gameState` | `GameState \| null` | Current game state |
| `ai` | `AIPlayer \| null` | AI player instance |
| `currentPlayer` | `PlayerState \| null` | Active player |
| `opponent` | `PlayerState \| null` | Inactive player |
| `isPlayerTurn` | `boolean` | True if player 0's turn |
| `isAITurn` | `boolean` | True if player 1's turn |
| `isGameOver` | `boolean` | True if game has winner |
| `winner` | `string \| null` | Winner's player ID |

### Action Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `initializeGame` | `deck1, deck2, aiSkillLevel?` | `void` | Start new game |
| `draw` | `playerIndex` | `void` | Draw a card |
| `playCreature` | `playerIndex, lane, cardId, faceDown?, mode?` | `boolean` | Play creature card |
| `playSupport` | `playerIndex, slot, cardId, activate?` | `boolean` | Play support/action card |
| `activateSupport` | `playerIndex, slot` | `boolean` | Activate support card |
| `attack` | `playerIndex, attackerLane, targetLane` | `void` | Execute attack |
| `toggleCreatureMode` | `playerIndex, lane` | `boolean` | Switch ATK/DEF mode |
| `endTurn` | - | `void` | End current turn |
| `refresh` | - | `void` | Manually trigger re-render |

## Benefits

### 1. No More Stale State
Every action increments the version counter, forcing React re-renders with fresh data.

### 2. Simplified Components
Components don't need to manage refresh logic, AI execution, or callback refs.

### 3. Type Safety
All methods are properly typed with TypeScript inference.

### 4. Consistent Patterns
All actions follow the same pattern: call method → state updates → auto-refresh.

### 5. Easier Testing
Hook can be mocked or tested independently from UI components.

### 6. Network Ready
Hook can be extended to sync actions via Socket.io without changing component code.

## Migration Guide

### Step 1: Replace imports
```diff
- import { BattleEngine } from "../battle/BattleEngine";
- import { AIPlayer } from "../battle/AIPlayer";
+ import { useBattleEngine } from "../hooks/useBattleEngine";
```

### Step 2: Replace state declarations
```diff
- const [engine, setEngine] = useState<BattleEngine | null>(null);
- const [ai, setAi] = useState<AIPlayer | null>(null);
- const [refreshTrigger, setRefreshTrigger] = useState(0);
+ const {
+   engine,
+   gameState,
+   currentPlayer,
+   opponent,
+   draw,
+   playCreature,
+   // ... other actions
+ } = useBattleEngine();
```

### Step 3: Remove manual refresh logic
```diff
- const refresh = () => setRefreshTrigger(prev => prev + 1);
- const handleDraw = () => {
-   engine.draw(game.activePlayer);
-   refresh();
- };
+ const handleDraw = () => {
+   draw(gameState.activePlayer);
+ };
```

### Step 4: Remove AI useEffect
```diff
- useEffect(() => {
-   if (!engine || !ai) return;
-   // ... 30 lines of AI logic
- }, [engine, ai, refreshTrigger]);
+ // AI now handled automatically by hook
```

### Step 5: Update state references
```diff
- const game = engine.state;
- const currentPlayer = game.players[game.activePlayer];
- const opponent = game.players[game.activePlayer === 0 ? 1 : 0];
+ // Already provided by hook
```

## Future Enhancements

### Network Sync
The hook can be extended to sync actions via Socket.io:

```typescript
const playCreature = useCallback((...args) => {
  if (!engine) return false;
  const success = engine.playCreature(...args);
  if (success) {
    refresh();
    socket.emit('playCreature', args); // Network sync
  }
  return success;
}, [engine, refresh, socket]);
```

### State Persistence
Add undo/redo by storing version snapshots:

```typescript
const [history, setHistory] = useState<GameState[]>([]);

const undo = useCallback(() => {
  if (history.length === 0) return;
  const previousState = history[history.length - 1];
  engine.restoreState(previousState);
  setHistory(prev => prev.slice(0, -1));
  refresh();
}, [engine, history, refresh]);
```

### Redux Integration
Hook can dispatch Redux actions for global state management:

```typescript
const draw = useCallback((playerIndex: number) => {
  if (!engine) return;
  engine.draw(playerIndex);
  dispatch(gameActions.cardDrawn({ playerIndex }));
  refresh();
}, [engine, refresh, dispatch]);
```

## Technical Notes

### Why Version Counter?
React's reconciliation algorithm doesn't detect mutations to nested objects. By incrementing a primitive value (`version`), we guarantee React sees a state change.

### Why Callbacks?
Using `useCallback` ensures:
1. Stable function references (prevents unnecessary re-renders)
2. Proper dependency tracking
3. Closure capture of latest state

### AI Execution Timing
The 1-second delay before AI turns provides:
1. Better UX (players can see what happened)
2. Time for animations to complete
3. Prevents race conditions from rapid state changes

### Ref vs State for AI
`aiTurnInProgressRef` is a ref (not state) because:
1. We don't need re-renders when it changes
2. It's a synchronization flag, not UI state
3. Prevents infinite loops in useEffect

## Performance Considerations

### Minimal Re-renders
Only increments version on actual game actions, not on every render.

### Memoized Derived State
Derived values like `currentPlayer` are recalculated on each render but remain fast (simple object access).

### Future Optimization
If performance becomes an issue, individual derived values can be memoized:

```typescript
const currentPlayer = useMemo(() => 
  gameState ? gameState.players[gameState.activePlayer] : null,
  [gameState?.activePlayer]
);
```

## Conclusion

The `useBattleEngine` hook provides a robust, maintainable, and scalable solution for managing BattleEngine state in React. It eliminates entire classes of bugs related to stale state and manual refresh management while preparing the codebase for network multiplayer integration.
