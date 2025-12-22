# Structured Game Log System

## Overview

The game log system has been refactored from simple string arrays to a structured event-based system with TypeScript interfaces. This provides better type safety, easier UI customization, and the foundation for features like game replay, analytics, and advanced filtering.

## Key Components

### 1. GameLogger Class (`src/battle/GameLog.ts`)

The central logging system that manages all game events.

**Key Features:**
- Generates unique IDs for each event (using `crypto.randomUUID()`)
- Tracks sequence numbers and timestamps
- Provides both structured events and legacy string messages
- Type-safe event logging with specific data payloads

**Usage:**
```typescript
// Access via BattleEngine
engine.logger.cardDrawn(turn, phase, playerId, playerName, cardId, cardName, deckSize);

// Or legacy string logging (still works)
engine.log("Simple message");
```

### 2. GameLogEvent Interface

Structured event with rich metadata:

```typescript
interface GameLogEvent<TType, TData> {
  id: string;              // Unique UUID
  seq: number;             // Monotonically increasing sequence
  ts: number;              // Timestamp (Date.now())
  turn: number;            // Game turn
  phase?: Phase;           // DRAW | MAIN
  actor?: PlayerId;        // Who caused the event (0 | 1)
  type: GameLogEventType;  // Event category
  message: string;         // Human-readable message
  severity?: "INFO" | "WARN" | "ERROR";
  
  // Structured references for UI and replay
  entities?: {
    players?: PlayerId[];
    cards?: CardRef[];
    effects?: EffectRef[];
    lanes?: LaneRef[];
    slots?: SlotRef[];
  };
  
  data?: TData;            // Type-specific payload
  raw?: string;            // Original string (optional)
}
```

### 3. Event Types

```typescript
type GameLogEventType =
  | "GAME_START" | "TURN_START" | "PHASE_CHANGE" | "TURN_END" | "GAME_END"
  | "CARD_DRAWN" | "CARD_PLAYED" | "CARD_ACTIVATED" | "CARD_FLIPPED" 
  | "CARD_DESTROYED"
  | "ATTACK_DECLARED" | "ATTACK_DIRECT" | "DAMAGE_DEALT"
  | "EFFECT_TRIGGERED" | "EFFECT_APPLIED" | "EFFECT_EXPIRED"
  | "MODE_CHANGED"
  | "INFO" | "WARNING" | "ERROR";
```

### 4. Typed Data Payloads

Each event type can have specific data:

```typescript
// Example: Card draw event
interface CardDrawnData {
  cardId: string;
  cardName: string;
  deckRemaining: number;
}

// Example: Attack event
interface AttackData {
  attackerId: string;
  attackerName: string;
  attackerLane: number;
  targetId?: string;
  targetName?: string;
  targetLane?: number;
  isDirect: boolean;
  damage?: number;
}
```

## Usage Examples

### Basic Logging in BattleEngine

```typescript
// Card drawn
this.logger.cardDrawn(
  this.state.turn,
  this.state.phase,
  playerIndex,
  player.id,
  card.id,
  card.name,
  player.deck.length
);

// Card played
this.logger.cardPlayed(
  this.state.turn,
  this.state.phase,
  playerIndex,
  player.id,
  { id: card.id, name: card.name, type: "Creature" },
  { lane: 0, faceDown: false, mode: "ATTACK" }
);

// Attack
this.logger.attack(
  this.state.turn,
  this.state.phase,
  { 
    player: attackerPlayer, 
    playerName: "Player 1",
    card: { id: creature.id, name: creature.name },
    lane: 0
  },
  { 
    player: targetPlayer, 
    playerName: "Player 2",
    card: { id: target.id, name: target.name },
    lane: 1
  }
);
```

### UI Component (Simple)

```tsx
import { GameLogger } from "../../../battle/GameLog";

interface GameLogProps {
  log: GameLogger;
}

export const GameLog = ({ log }: GameLogProps) => {
  const events = log.getEvents();
  const recent = events.slice(-10).reverse();

  return (
    <div>
      {recent.map((event) => (
        <div key={event.id} style={{ borderLeft: `3px solid ${getColor(event.type)}` }}>
          <span>{event.type}</span>
          <span>Turn {event.turn}</span>
          <div>{event.message}</div>
        </div>
      ))}
    </div>
  );
};
```

### Advanced UI with Filtering

See `src/ui/Battle/GameLog/AdvancedGameLog.tsx` for a full-featured example with:
- Category filtering (Game Flow, Cards, Combat, Effects)
- Event count limits
- Timestamp display
- Entity references display
- Color-coded event types
- Severity indicators

## Benefits

### 1. Type Safety
- TypeScript ensures correct event data
- No more string parsing
- Compile-time error checking

### 2. UI Flexibility
- Filter by event type, player, turn, etc.
- Color-code events dynamically
- Show/hide specific information
- Easy to implement search

### 3. Analytics & Replay
- Structured data enables game replay
- Track player actions for analytics
- Export game history
- Debug specific interactions

### 4. Backward Compatibility
- Legacy `engine.log(string)` still works
- `log.getMessages()` returns string array
- Existing code continues to function

## Migration Notes

### Updated Files
1. **`src/battle/GameLog.ts`** - New logger class
2. **`src/battle/GameState.ts`** - Changed `log: string[]` to `log: GameLogger`
3. **`src/battle/BattleEngine.ts`** - Uses structured logging methods
4. **`src/effects/handler.ts`** - Effect utilities use logger
5. **`src/ui/Battle/GameLog/GameLog.tsx`** - Enhanced UI component
6. **`src/ui/app.tsx`** - Updated initialization

### Breaking Changes
- `state.log` is no longer a string array
- Use `state.log.getMessages()` for string array
- Use `state.log.getEvents()` for structured events

### To Add Logging Elsewhere

```typescript
// In BattleEngine or with access to state
state.log.info(turn, phase, "Your message");
state.log.warning(turn, phase, "Warning message");
state.log.error(turn, phase, "Error message");

// Or use specific event methods
state.log.effectTriggered(turn, phase, effectId, name, sourceCard, trigger);
state.log.cardDestroyed(turn, phase, player, playerName, card, reason);
```

## Future Enhancements

1. **Event Subscriptions** - Listen for specific event types
2. **Game Replay** - Reconstruct game state from events
3. **Export/Import** - Save and load game history
4. **Analytics Dashboard** - Track statistics across games
5. **Network Sync** - Share events for multiplayer
6. **Undo/Redo** - Roll back game state using events

## Example: Query Events

```typescript
// Get all card plays by player 1
const player1Plays = logger.getEvents().filter(e => 
  e.type === "CARD_PLAYED" && e.actor === 0
);

// Get all attacks in turn 5
const turn5Attacks = logger.getEvents().filter(e =>
  (e.type === "ATTACK_DECLARED" || e.type === "ATTACK_DIRECT") &&
  e.turn === 5
);

// Get all events involving a specific card
const cardEvents = logger.getEvents().filter(e =>
  e.entities?.cards?.some(c => c.id === specificCardId)
);
```
