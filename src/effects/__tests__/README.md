# Effects Test Suite

This directory contains comprehensive tests for the effects system.

## Test Files

### EffectRegistry.test.ts
Tests the effect registry structure and data integrity:
- Validates effects load from data.json
- Checks effect structure (id, name, trigger)
- Ensures unique effect IDs
- Verifies registry lookups work correctly
- Validates trigger types

### EffectMetadata.test.ts
Tests effect metadata and validation:
- Validates metadata registry structure
- Tests getEffectMetadata utility
- Checks canActivate validation
- Tests activation requirements
- Validates targeting configuration
- Tests getValidTargets for targetable effects

### EffectHandler.test.ts
Tests effect handler utilities and execution:
- Validates all utility functions are available
- Tests getAllyCreatures, getEnemyCreatures, getAllCreatures
- Tests getCreatureInLane for lane lookups
- Tests filterByAffinity and filterByKeywords
- Tests drawCards functionality
- Tests modifyCreatureStats
- Validates effect execution doesn't throw errors

### EffectResolve.test.ts
Tests effect resolution and trigger matching:
- Handles missing parameters gracefully
- Tests non-existent effect IDs
- Validates trigger type matching
- Tests event data passing
- Tests multiple effect resolutions

## Running Tests

Run all effect tests:
```bash
npm run test -- src/effects/__tests__
```

Run specific test file:
```bash
npm run test -- src/effects/__tests__/EffectRegistry.test.ts
```

## Test Coverage

The test suite covers:
- ✅ Effect registry loading and structure
- ✅ Effect metadata validation
- ✅ Effect handler utilities
- ✅ Effect resolution logic
- ✅ Error handling and edge cases
- ✅ Trigger type matching
- ✅ Filter functions (affinity, keywords)
- ✅ Stat modifications
- ✅ Card drawing mechanics

## Adding New Tests

When adding new effect-related functionality:
1. Add tests to the appropriate file based on the layer being tested
2. Follow the existing test patterns
3. Ensure tests are focused on behavior, not implementation details
4. Test both success and error cases
