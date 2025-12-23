# Effect Metadata System

## Problem
Previously, effect-specific logic was hardcoded in multiple places:
- **BattleEngine.ts** - Activation requirements checked with if-statements for specific effect IDs
- **app.tsx** - Targeting logic duplicated for each effect that needs targets
- **Not scalable** - Adding new effects required changes in multiple files

## Solution
Centralized **Effect Metadata System** in `/src/effects/metadata.ts`

### Architecture

All effect-specific logic is now defined in ONE place: `metadata.ts`

```typescript
export interface EffectMetadata {
  id: string;
  name: string;
  description: string;
  
  // Can this effect be activated? (validation)
  canActivate?: (state: GameState, ownerIndex: 0 | 1) => {
    canActivate: boolean;
    reason?: string;
  };
  
  // Does this effect require targeting? (UI configuration)
  targeting?: TargetingConfig;
  
  // What are the valid targets? (UI dropdown options)
  getValidTargets?: (state: GameState, ownerIndex: 0 | 1) => Array<{
    label: string;
    value: number;
    metadata?: any;
  }>;
}
```

### How to Add New Effects

1. **Create effect handler** in `/src/effects/effect/your_effect.ts` (already done)
2. **Add metadata** in `/src/effects/metadata.ts`:

```typescript
export const effectMetadata: Record<string, EffectMetadata> = {
  your_new_effect: {
    id: "your_new_effect",
    name: "Your Effect Name",
    description: "What this effect does",
    
    // Optional: Validation before activation
    canActivate: (state, ownerIndex) => {
      // Check if effect can be activated
      const hasValidTarget = /* your logic */;
      return {
        canActivate: hasValidTarget,
        reason: hasValidTarget ? undefined : "User-friendly error message"
      };
    },
    
    // Optional: If effect requires targeting
    targeting: {
      required: true,
      targetType: "OPPONENT_SUPPORT" | "ALLY_CREATURE" | "ENEMY_CREATURE" | etc,
      description: "UI prompt text",
      allowMultiple: false,
    },
    
    // Optional: Get dropdown options for target selection
    getValidTargets: (state, ownerIndex) => {
      // Return array of options for UI dropdown
      return [
        { label: "Option 1", value: 0, metadata: {...} },
        { label: "Option 2", value: 1, metadata: {...} }
      ];
    }
  }
};
```

3. **That's it!** No changes needed in BattleEngine or app.tsx

### Usage

**BattleEngine** queries metadata for validation:
```typescript
const activationCheck = canActivateEffect(card.effectId, this.state, playerIndex);
if (!activationCheck.canActivate) {
  // Handle failure with activationCheck.reason
}
```

**UI (app.tsx)** queries metadata for targeting:
```typescript
if (effectRequiresTargeting(card.effectId)) {
  const options = getEffectTargets(card.effectId, gameState, 0);
  const metadata = getEffectMetadata(card.effectId);
  // Show target selection modal
}
```

### Benefits

1. ✅ **Single Source of Truth** - Effect logic in one file
2. ✅ **No Hardcoding** - BattleEngine and UI are generic
3. ✅ **Easy to Scale** - Add new effects without touching engine/UI code
4. ✅ **Type Safety** - TypeScript interfaces ensure consistency
5. ✅ **Better Organization** - Effect requirements clearly documented
6. ✅ **Reusable** - Same system for all future effects

### Current Effects Using System

- `purge_opponent_support` - Removes opponent support card
- `boost_fire_and_extend_ignite` - Boosts Fire creatures

### Adding More Effects

Just add entries to `effectMetadata` object in `/src/effects/metadata.ts`. The system handles:
- Validation checks
- Target selection UI
- Error messages
- Event data mapping

No more scattered if-statements checking specific effect IDs!
