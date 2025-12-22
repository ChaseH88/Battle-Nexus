# Battle Nexus: Replay & Undo System Documentation

## Overview

The Battle Nexus game engine now includes a comprehensive event-based logging system that enables:
- **Game Replay**: Watch battles play out step-by-step ("film mode")
- **Real-time Network Sync**: Replay opponent's actions via Socket.io
- **Undo Functionality**: Revert actions during gameplay
- **Analytics & Debugging**: Analyze game patterns and troubleshoot issues
- **State Persistence**: Save and load game states

## Architecture

### Core Components

1. **GameLogger** (`src/battle/GameLog.ts`)
   - Captures all game events with structured data
   - Creates automatic state snapshots at critical moments
   - Supports JSON serialization for network transmission
   - Provides filtering and querying capabilities

2. **ReplayEngine** (`src/battle/ReplayEngine.ts`)
   - Reconstructs game state from event log
   - Supports playback controls (play/pause/step/speed)
   - Enables jumping to specific events
   - Perfect for "film mode" viewing

3. **UndoManager** (`src/battle/UndoManager.ts`)
   - Manages undo/redo functionality
   - Uses snapshots to restore previous states
   - Tracks reversible vs non-reversible actions
   - Supports multi-step undo

## Key Features

### Automatic State Snapshots

The system automatically captures complete game state at major events:
- Turn start
- Phase changes
- Card played
- Attack declared
- Card destroyed
- Game end

This enables instant restoration to any previous point without replaying all events.

### Event Types

All events include:
```typescript
{
  id: string;              // Unique identifier
  seq: number;             // Sequence number
  ts: number;              // Timestamp
  turn: number;            // Turn number
  phase: "DRAW" | "MAIN";  // Game phase
  actor: 0 | 1;            // Player who acted
  type: GameLogEventType;  // Event classification
  message: string;         // Human-readable description
  severity: "INFO" | "WARN" | "ERROR";
  entities: {...};         // References to cards, players, lanes
  data: {...};             // Type-specific payload
  stateSnapshot?: {...};   // Full state (for major events)
  reversible?: boolean;    // Can be undone
}
```

### Reversible vs Non-Reversible Actions

**Reversible** (can be undone):
- Playing cards (creatures, support)
- Activating support cards
- Changing creature modes
- Declaring attacks (before resolution)

**Non-Reversible** (cannot be undone):
- Drawing cards (involves hidden information)
- Effect triggers (automatic)
- Damage dealt (part of attack resolution)
- Card destruction (consequence of actions)

## Usage Examples

### 1. Film Mode - Watch a Battle Replay

```typescript
import { ReplayEngine } from './battle/ReplayEngine';
import { GameLogger } from './battle/GameLog';

// Get the event log from a completed game
const logger = gameState.log;
const events = logger.getEvents();

// Create replay engine with UI callback
const replay = new ReplayEngine(events, {
  speed: 1,
  autoPlay: true,
  onEventReplay: (event, state) => {
    // Update UI to show current event
    updateGameUI(state);
    showEventNotification(event.message);
  },
  onComplete: () => {
    console.log("Replay finished!");
  }
});

// Playback controls
replay.pause();
replay.resume();
replay.setSpeed(2); // 2x speed
replay.stepForward();
replay.stepBackward();
replay.jumpToEvent(50); // Jump to event #50
```

### 2. Network Sync with Socket.io

**Server Side:**
```typescript
// Server receives action from Player 1
socket.on('playerAction', (action) => {
  // Process action in server's game state
  const result = processAction(action);
  
  // Get the new events generated
  const newEvents = gameLogger.getEventsByTurn(currentTurn);
  
  // Send events to Player 2 for replay
  io.to(player2Socket).emit('replayEvents', newEvents);
});
```

**Client Side (Player 2):**
```typescript
socket.on('replayEvents', (events) => {
  // Replay opponent's turn in real-time
  const replay = new ReplayEngine(events, {
    speed: 1,
    autoPlay: true,
    onEventReplay: (event, state) => {
      // Animate opponent's actions
      animateEvent(event);
      updateGameState(state);
    }
  });
});
```

### 3. Undo Functionality

```typescript
import { UndoManager } from './battle/UndoManager';

// Create undo manager
const undoManager = new UndoManager(gameLogger);

// Check if undo is available
if (undoManager.canUndo()) {
  // Get available undo steps for UI
  const steps = undoManager.getUndoSteps();
  displayUndoMenu(steps);
  
  // Perform undo
  const snapshot = undoManager.undo();
  if (snapshot) {
    restoreStateFromSnapshot(gameState, snapshot);
    updateUI(gameState);
  }
}
```

### 4. Export/Import Game Log

```typescript
import { exportGameLog, importGameLog } from './battle/ReplayEngine';

// Export game log for sharing or storage
const events = gameLogger.getEvents();
const exportData = exportGameLog(events, {
  player1Name: "Alice",
  player2Name: "Bob",
  winner: "Alice",
  duration: 1200000 // 20 minutes in ms
});

// Save to file or send to server
localStorage.setItem('lastGame', exportData);
// or
await fetch('/api/games', {
  method: 'POST',
  body: exportData
});

// Import and replay later
const saved = localStorage.getItem('lastGame');
const { events, metadata } = importGameLog(saved);
const replay = new ReplayEngine(events);
```

### 5. Analytics - Find Specific Patterns

```typescript
// Find all attacks in the game
const attacks = logger.getEventsByType('ATTACK_DECLARED');
console.log(`Total attacks: ${attacks.length}`);

// Analyze damage dealt
const damageEvents = logger.getEventsByType('DAMAGE_DEALT');
const totalDamage = damageEvents.reduce((sum, e) => sum + e.data.amount, 0);

// Find events for a specific turn
const turn3Events = logger.getEventsByTurn(3);

// Get game timeline
const timeline = logger.getEvents().map(e => ({
  turn: e.turn,
  phase: e.phase,
  actor: e.actor,
  action: e.type,
  message: e.message
}));
```

## Integration with BattleEngine

The BattleEngine automatically logs all major actions with state snapshots:

```typescript
// Drawing a card
engine.draw(playerIndex);
// Logs: CARD_DRAWN with snapshot

// Playing a creature
engine.playCreature(playerIndex, lane, cardId, false, "ATTACK");
// Logs: CARD_PLAYED with snapshot

// Attacking
engine.attack(attackerLane, targetPlayerIndex, targetLane);
// Logs: ATTACK_DECLARED with snapshot

// All methods automatically capture state for replay/undo
```

## Network Protocol Design

For multiplayer Socket.io implementation:

### Event Structure
```typescript
{
  gameId: string;
  playerId: string;
  events: GameLogEvent[];
  sequenceStart: number;
  sequenceEnd: number;
}
```

### Sync Flow
1. Player 1 performs action
2. Server validates and applies action
3. Server generates events (CARD_PLAYED, EFFECT_TRIGGERED, etc.)
4. Server sends events to Player 2
5. Player 2's ReplayEngine applies events to local state
6. Both players in sync

### Handling Disconnects
- Server maintains full event log
- On reconnect, send all events since last known sequence number
- Client replays missing events to catch up

## Best Practices

### 1. State Snapshot Frequency
- Don't snapshot every event (too much memory)
- Current system snapshots major events only
- Configure via `GameLogger({ snapshotOnMajorEvents: true })`

### 2. Event Granularity
- Each atomic action gets one event
- Complex actions generate multiple events
- Example: Playing a card with ON_PLAY effect = CARD_PLAYED + EFFECT_TRIGGERED

### 3. Reversible Action Design
- Only mark actions reversible if they can be cleanly undone
- Hidden information (deck, opponent's hand) prevents reversal
- Automatic effects should not be reversible

### 4. Network Optimization
- Send only new events, not entire log
- Use sequence numbers to track sync state
- Compress event payloads for transmission

### 5. Performance Considerations
- Limit maximum undo history (default: 50 steps)
- Clear old events after a certain point
- Use pagination for very long games

## Future Enhancements

### Planned Features
1. **Full State Reconstruction**: Reconstruct complete game state from events without snapshots
2. **Event Compression**: Merge consecutive similar events
3. **Branching Timelines**: Support "what-if" scenarios
4. **Replay Editing**: Edit and re-run specific actions
5. **AI Training Data**: Export logs in format suitable for ML training

### Network Features
1. **Spectator Mode**: Multiple viewers watch live replays
2. **Tournament Recording**: Automatic recording of ranked matches
3. **Replay Sharing**: Share interesting games with community
4. **Bug Reporting**: Attach event log to bug reports for reproduction

## Troubleshooting

### "Cannot replay: No initial game state"
- Ensure first event is GAME_START with proper data
- Or ensure first snapshot includes player deck information

### "Cannot undo: No snapshot available"
- Need at least one snapshot before the action
- Increase snapshot frequency if needed

### "State mismatch after replay"
- Check that all event types are properly handled in ReplayEngine
- Verify snapshot data includes all necessary state

### "Memory usage too high"
- Reduce snapshot frequency
- Implement event pruning for old turns
- Use compression for stored logs

## API Reference

See type definitions in:
- `src/battle/GameLog.ts` - Event types and logger
- `src/battle/ReplayEngine.ts` - Replay functionality
- `src/battle/UndoManager.ts` - Undo/redo system

## Example: Complete Replay System

```typescript
// Setup
const logger = new GameLogger({ snapshotOnMajorEvents: true });
const gameState = createGameState(player1, player2);
gameState.log = logger;
const engine = new BattleEngine(gameState);

// Play the game
engine.draw(0);
engine.playCreature(0, 0, "card-1", false, "ATTACK");
engine.attack(0, 0, 0);
// ... more actions ...

// Export when done
const exportData = exportGameLog(logger.getEvents(), {
  player1Name: gameState.players[0].id,
  player2Name: gameState.players[1].id,
  winner: gameState.winnerIndex === 0 ? "Player 1" : "Player 2",
  duration: Date.now() - startTime
});

// Save or share
localStorage.setItem('epicBattle', exportData);

// Later: Load and replay
const { events, metadata } = importGameLog(localStorage.getItem('epicBattle'));
const replay = new ReplayEngine(events, {
  speed: 1.5,
  autoPlay: true,
  onEventReplay: (event, state) => {
    renderGame(state);
    showEventPopup(event.message);
  }
});
```

## Conclusion

The replay and undo system provides a solid foundation for:
- Enhanced single-player experience with undo
- Multiplayer synchronization via event streaming
- Community features (sharing, spectating)
- Development tools (debugging, testing)
- Future AI/ML capabilities

The system is designed to be extensible and ready for Socket.io integration when you're ready to build the multiplayer backend.
