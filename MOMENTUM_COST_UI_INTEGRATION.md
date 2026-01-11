# Cost/Momentum System - UI Integration Guide

## Overview
The Battle Nexus engine now enforces a cost/momentum payment system for all card plays. This document outlines the UI changes needed to provide proper player feedback and prevent invalid actions.

## Engine Changes Summary

### Type Updates
- `CardInterface.cost` is now **required** (was optional)
- All cards must have a `cost` value (0, 1, 3, 4, 5)
- `momentumCost` field is deprecated (use `cost` instead)

### New Validation APIs
The `BattleEngine` class now provides three validation methods for UI pre-checks:

```typescript
// Check if player can afford a specific card
canAffordCard(playerIndex: 0 | 1, cardId: string): CommandResult

// Get list of all affordable cards in hand
getAffordableCards(playerIndex: 0 | 1): CardInterface[]

// Quick check if any card is affordable
hasAffordableCard(playerIndex: 0 | 1): boolean
```

### Error Handling
When a play is rejected, `playCreature()` and `playSupport()` return `false` and log an error message. The validation APIs provide structured errors via `CommandResult`:

```typescript
interface CommandError {
  code: CommandErrorCode;
  message: string;
  context?: {
    required?: number;    // Cost needed
    available?: number;   // Momentum available
    cardName?: string;
    cardId?: string;
    [key: string]: any;
  };
}
```

## Required UI Updates

### 1. Display Current Momentum
**Location:** Player HUD / Status Bar

**Implementation:**
```typescript
// Access momentum from game state
const playerMomentum = engine.state.players[playerIndex].momentum;

// Display format: "Momentum: 5/10"
<div className="momentum-display">
  Momentum: {playerMomentum}/10
</div>
```

**Design Notes:**
- Show both current and max momentum (always 10)
- Update in real-time as momentum changes
- Consider visual indicators (progress bar, colored text)

### 2. Card Affordability Indicators
**Location:** Hand UI, Card tooltips

**Implementation:**
```typescript
// For each card in hand, check affordability
const isAffordable = player.momentum >= card.cost;

// Apply visual styling
<Card 
  card={card}
  className={isAffordable ? 'affordable' : 'unaffordable'}
  disabled={!isAffordable}
/>
```

**Styling Suggestions:**
- **Affordable cards:** Normal brightness, full opacity
- **Unaffordable cards:** Grayed out, 50% opacity, red border
- Show cost badge on card (e.g., gem icon with number)

**Validation Check:**
```typescript
// Use validation API for precise feedback
const result = engine.canAffordCard(playerIndex, card.id);
if (!result.success) {
  // Show tooltip: "Not enough momentum. Need 3, have 1."
  const error = result.error;
  tooltip.show(`${error.message}`);
}
```

### 3. Play Action Validation
**Location:** Card play handlers (onClick, onDrop)

**Before Attempting Play:**
```typescript
function handlePlayCard(cardId: string) {
  // Pre-check before attempting play
  const validation = engine.canAffordCard(playerIndex, cardId);
  
  if (!validation.success) {
    // Show error notification
    showNotification({
      type: 'error',
      message: validation.error.message,
      // e.g., "Not enough momentum to play Inferno Lion. Need 3, have 1."
    });
    return;
  }
  
  // Proceed with play action
  const success = engine.playCreature(playerIndex, lane, cardId);
  
  if (!success) {
    // Handle other failures (slot occupied, wrong phase, etc.)
    showNotification({
      type: 'error',
      message: 'Cannot play card at this time.'
    });
  }
}
```

### 4. Disable Unaffordable Actions
**Location:** Card drag-and-drop, play buttons

**Implementation:**
```typescript
// Prevent dragging unaffordable cards
function canDragCard(card: CardInterface): boolean {
  return player.momentum >= card.cost;
}

// Disable play button for unaffordable cards
<button
  onClick={() => handlePlayCard(card.id)}
  disabled={player.momentum < card.cost}
>
  Play Card (Cost: {card.cost})
</button>
```

### 5. Error Feedback
**Location:** Notification system, toast messages

**Error Display:**
```typescript
function handlePlayError(error: CommandError) {
  switch (error.code) {
    case 'INSUFFICIENT_MOMENTUM':
      return `Not enough momentum! Need ${error.context?.required}, have ${error.context?.available}`;
    
    case 'INVALID_PHASE':
      return 'Cannot play cards during draw phase';
    
    case 'SLOT_OCCUPIED':
      return 'That lane/slot is already occupied';
    
    default:
      return 'Cannot play card';
  }
}
```

**User-Friendly Messages:**
- "Not enough momentum to play [Card Name]. Need X, have Y."
- "Cannot afford this card right now."
- "Wait for more momentum before playing this card."

### 6. Contextual Help
**Location:** Tooltips, help overlay

**Momentum Explanation:**
- "Momentum is gained by attacking and winning battles"
- "Momentum caps at 10"
- "Cards cost 0-5 momentum to play"
- "Cost 0 cards can be played anytime"

**Card Cost Display:**
```typescript
<CardTooltip>
  <div className="cost-info">
    <span className="cost-label">Cost:</span>
    <span className="cost-value">{card.cost}</span>
    <span className="cost-description">
      {card.cost === 0 ? 'Free to play' : `Requires ${card.cost} momentum`}
    </span>
  </div>
</CardTooltip>
```

## Testing the UI Integration

### Scenario 1: Starting Game (0 Momentum)
- Player should only see cost-0 cards as playable
- All other cards grayed out
- Tooltip shows "Need X momentum"

### Scenario 2: Gaining Momentum
- After attack, momentum display updates
- Cards become affordable dynamically
- Visual feedback shows newly playable cards

### Scenario 3: Playing Multiple Cards
- Each play deducts momentum
- Remaining cards update affordability in real-time
- Player cannot overdraw momentum

### Scenario 4: Error Handling
- Clicking unaffordable card shows error
- Error message includes specific values
- No state mutation occurs

## API Reference Summary

### Validation Methods
```typescript
// BattleEngine methods for UI
engine.canAffordCard(playerIndex, cardId) -> CommandResult
engine.getAffordableCards(playerIndex) -> CardInterface[]
engine.hasAffordableCard(playerIndex) -> boolean
```

### State Access
```typescript
// Read current momentum
engine.state.players[playerIndex].momentum

// Read card cost
card.cost // number (0-5)
```

### Error Types
```typescript
import { 
  CommandErrorCode,
  CommandResult,
  CommandError 
} from '@battle/CommandTypes';
```

## Implementation Priority

1. **High Priority** (Must have for v1):
   - Display current momentum
   - Gray out unaffordable cards
   - Show error messages on invalid plays

2. **Medium Priority** (Polish):
   - Drag-and-drop prevention for unaffordable cards
   - Animated momentum changes
   - Cost badges on cards

3. **Low Priority** (Nice to have):
   - Advanced tooltips with cost breakdown
   - Momentum prediction ("If you play this, you'll have X left")
   - Tutorial/help overlay

## Notes for Developers

- **No State Mutation:** Validation methods never mutate game state
- **Type Safety:** Use `CommandResult` for proper error handling
- **Consistent UX:** All card types (Creature, Support, Action, Trap) follow same cost rules
- **Future-Proof:** MAX cards use the same `cost` field (5), no special handling needed

## Migration from Old System

If your UI previously used `momentumCost`:
```typescript
// OLD (deprecated)
if (card.isMax && card.momentumCost) {
  cost = card.momentumCost;
}

// NEW (correct)
const cost = card.cost; // Always use this
```

The engine will log deprecation warnings for cards still using `momentumCost`.
