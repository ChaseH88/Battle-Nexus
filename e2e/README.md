# Battle Nexus - E2E Tests with Playwright

This directory contains end-to-end tests for the Battle Nexus card game, using Playwright to automate browser testing.

## 📋 Test Files

### `battle-ko-logic.spec.ts`
Mimics the Jest test from `Battle.test.ts`. Tests the core game mechanic of tracking Knockouts (KOs) and declaring a winner when a player reaches 3 KOs.

**What it tests:**
- Drawing cards from the deck
- Playing creatures to lanes
- Attacking opponent creatures
- Tracking KO count
- Winner declaration at 3 KOs

### `battle-effects.spec.ts`
Mimics the Jest test from `BattleEffects.test.ts`. Tests that card effects trigger correctly during gameplay.

**What it tests:**
- ON_PLAY effects when creatures are summoned
- ON_ATTACK effects when creatures attack
- Support card placement and activation
- Game log entries for effects

## 🚀 Running Tests

### Run all E2E tests (headless mode)
```bash
npm run test:e2e
```

### Run tests with UI (interactive mode)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see the browser)
```bash
npm run test:e2e:headed
```

### Debug tests step-by-step
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test battle-ko-logic.spec.ts
```

## 🎯 Test Selectors (data-testid)

The UI components have been instrumented with `data-testid` attributes for reliable test selection:

### Controls
- `draw-button` - Draw card button
- `end-turn-button` - End turn button  
- `new-game-button` - Start new game button

### Hand
- `hand-card` - Individual cards in hand (also has `data-card-name` and `data-card-type`)

### Creature Zone
- `creature-lane-{0-4}` - Player's creature lanes
- `opponent-creature-lane-{0-4}` - Opponent's creature lanes
- `play-creature-lane-{0-4}` - Play creature buttons
- `attack-button` - Direct attack button
- `attack-button-lane-{0-4}` - Attack specific lane button

### Support Zone
- `support-slot-{0-2}` - Support card slots
- `support-card` - Active support card

### Game State
- `player-ko-count` - Player's KO count
- `opponent-ko-count` - Opponent's KO count
- `winner-message` - Game over / winner message
- `game-log` - Game log container

### Modals
- `play-attack-button` - Play creature in attack mode
- `play-defense-button` - Play creature in defense mode

## 📝 Test Structure

Each test follows this pattern:

1. **Setup** - Navigate to the game and wait for it to load
2. **Helpers** - Define reusable functions for common actions
3. **Test Steps** - Execute game actions in sequence
4. **Assertions** - Verify expected outcomes

Example:
```typescript
test('tracks KOs and declares winner', async ({ page }) => {
  // Navigate to game
  await page.goto('/');
  
  // Helper function
  const drawCard = async () => {
    await page.click('[data-testid="draw-button"]');
    await page.waitForTimeout(300);
  };
  
  // Test steps
  await drawCard();
  await playCreature('Quake Stag', 0, 'ATTACK');
  
  // Assertions
  const koCount = await getKOCount(0);
  expect(koCount).toBeGreaterThanOrEqual(1);
});
```

## 🔍 Debugging Tips

1. **Use headed mode** to see what's happening:
   ```bash
   npm run test:e2e:headed
   ```

2. **Use debug mode** to step through tests:
   ```bash
   npm run test:e2e:debug
   ```

3. **Check screenshots** - Playwright automatically captures screenshots on failure in `test-results/`

4. **View trace files** - Detailed execution trace available in the HTML report:
   ```bash
   npx playwright show-report
   ```

5. **Increase timeouts** if tests are flaky:
   ```typescript
   await page.waitForTimeout(1000); // Increase from 300ms
   ```

## ⚙️ Configuration

See `playwright.config.ts` for:
- Browser configurations (Chromium, Firefox, Webkit)
- Test timeout settings
- Screenshot/video capture settings
- Dev server configuration

## 🎮 Differences from Jest Tests

| Aspect | Jest Tests | Playwright Tests |
|--------|------------|------------------|
| **Scope** | Unit/Integration | End-to-End |
| **Speed** | Fast (~seconds) | Slower (~minutes) |
| **Environment** | Node.js | Real Browser |
| **What's Tested** | Game logic | Full UI interaction |
| **Assertions** | Direct state checks | Visual/behavioral checks |
| **AI Behavior** | Controlled | Fully autonomous |

## 📊 Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

The report includes:
- Test results (pass/fail)
- Screenshots on failure
- Execution traces
- Console logs
- Network activity

## 🛠️ Maintenance

When adding new UI features:
1. Add `data-testid` attributes to new components
2. Update test helpers if interaction patterns change
3. Add new test files for new game mechanics
4. Keep test selectors stable (don't change `data-testid` values)

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Selector Strategies](https://playwright.dev/docs/selectors)
- [Debugging Tests](https://playwright.dev/docs/debug)
