# Effect Metadata System

## Problem
Previously, effect-specific logic was hardcoded in multiple places:
- **BattleEngine.ts** - Activation requirements checked with if-statements for specific effect IDs
- **app.tsx** - Targeting logic duplicated for each effect that needs targets
- **Not scalable** - Adding new effects required changes in multiple files

## Solution
**One File Per Effect** - Each effect exports both handler AND metadata

### Architecture

All effect logic is now in ONE file per effect: `/src/effects/effect/your_effect.ts`

Each effect file exports:
1. **Handler function** - What the effect does (game logic)
2. **Metadata object** - When/how it can be used (validation & UI)

```typescript
// your_effect.ts
import { EffectContext } from "../handler";
import { GameState } from "../../battle/GameState";
import { EffectMetadata } from "../metadata";

// 1. Handler - executes the effect
export const your_effect = (ctx: EffectContext) => {
  // Effect implementation
};

// 2. Metadata - configures validation & targeting
export const your_effect_metadata: EffectMetadata = {
  id: "your_effect",
  name: "Your Effect Name",
  description: "What this does",
  
  canActivate: (state, ownerIndex) => {
    // Validation logic
    return { canActivate: true };
  },
  
  targeting: {
    required: true,
    targetType: "OPPONENT_SUPPORT",
    description: "Select target",
  },
  
  getValidTargets: (state, ownerIndex) => {
    // Return dropdown options
    return [];
  }
};
```

### How to Add New Effects

1. **Create ONE file** in `/src/effects/effect/your_effect.ts`
2. **Export handler** (game logic function)
3. **Export metadata** (validation & targeting config)
4. **Register in metadata.ts**:

```typescript
// /src/effects/metadata.ts
import { your_effect_metadata } from "./effect/your_effect";

export const effectMetadata = {
  your_effect: your_effect_metadata,
  // ... other effects
};
```

5. **Register in handler.ts**:

```typescript
// /src/effects/handler.ts
import { your_effect } from "./effect/your_effect";

export const effectHandlers = {
  your_effect,
  // ... other effects
};
```

**That's it!** No changes needed in BattleEngine or app.tsx

### File Structure

```
src/effects/
  effect/                      # Effect implementations
    purge_opponent_support.ts  # Handler + Metadata in ONE file
    boost_fire_and_extend_ignite.ts
    your_new_effect.ts         # Add new effects here
  
  handler.ts                   # Imports all handlers
  metadata.ts                  # Imports all metadata
  types.ts                     # Type definitions
```

### Benefits

1. ✅ **One File Per Effect** - Handler + metadata together
2. ✅ **No Hardcoding** - BattleEngine and UI are generic
3. ✅ **Easy to Scale** - Add effects without touching engine/UI
4. ✅ **Better Organization** - Everything about an effect in one place
5. ✅ **Type Safety** - TypeScript ensures consistency
6. ✅ **Self-Documenting** - Metadata describes requirements

### Current Effects

- `purge_opponent_support` - Removes opponent support card
- `boost_fire_and_extend_ignite` - Boosts Fire creatures

### Metadata Options

```typescript
interface EffectMetadata {
  id: string;                    // Effect ID
  name: string;                  // Display name
  description: string;           // What it does
  
  // Validation: Can this be activated?
  canActivate?: (state, ownerIndex) => {
    canActivate: boolean;
    reason?: string;             // Error message if false
  };
  
  // Targeting: Does this need a target?
  targeting?: {
    required: boolean;           // Must select target?
    targetType: string;          // What kind of target
    description: string;         // UI prompt
    allowMultiple?: boolean;     // Multiple targets?
  };
  
  // Get valid targets for dropdown
  getValidTargets?: (state, ownerIndex) => Array<{
    label: string;               // Display text
    value: number;               // Target index
    metadata?: any;              // Extra data
  }>;
}
```
