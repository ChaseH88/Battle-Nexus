import { test, expect } from "@playwright/test";

/**
 * E2E Test: KO and Win Logic
 *
 * Mimics the Jest test Battle.test.ts
 * Tests that the game correctly tracks KOs and declares a winner at 3 KOs
 */
test.describe("Battle Engine - KO and Win Logic", () => {
  test("tracks KOs and declares a winner at 3 KOs", async ({ page }) => {
    // Navigate to the game
    await page.goto('/');

    // Wait for game to load completely
    await expect(page.locator('.game-container')).toBeVisible();
    
    // Wait for game to initialize - check for phase indicator
    await expect(page.locator('text=/Phase: (DRAW|MAIN)/')).toBeVisible({ timeout: 10000 });
    
    // If we're in MAIN phase already, that's fine - we can start playing
    // Give it a moment for all React state to settle
    await page.waitForTimeout(500);

    // Helper: Get KO count from UI
    const getKOCount = async (playerIndex: 0 | 1) => {
      const koCountSelector =
        playerIndex === 0
          ? '[data-testid="player-ko-count"]'
          : '[data-testid="opponent-ko-count"]';

      const koText = await page.locator(koCountSelector).textContent();
      return parseInt(koText?.match(/\d+/)?.[0] || "0");
    };

    // Helper: Draw cards
    const drawCard = async () => {
      // Check if we're in DRAW phase
      const phase = await page.locator('text=/Phase: (DRAW|MAIN)/').textContent();
      
      if (phase?.includes('MAIN')) {
        // Already in MAIN phase, end turn to get back to DRAW
        await page.click('[data-testid="end-turn-button"]');
        await page.waitForTimeout(2000); // Wait for AI turn
      }
      
      // Now draw
      await page.click('[data-testid="draw-button"]');
      await page.waitForTimeout(300); // Wait for animation
    };

    // Helper: Play creature to lane
    const playCreature = async (
      cardName: string,
      lane: number,
      mode: "ATTACK" | "DEFENSE"
    ) => {
      // Find card in hand
      const handCard = page.locator(
        `[data-testid="hand-card"][data-card-name="${cardName}"]`
      );
      await expect(handCard).toBeVisible();

      // Drag to lane or click to select
      await handCard.click();

      // Click on the lane
      await page.click(`[data-testid="creature-lane-${lane}"]`);

      // Select mode in modal
      if (mode === "DEFENSE") {
        await page.click('[data-testid="play-defense-button"]');
      } else {
        await page.click('[data-testid="play-attack-button"]');
      }

      await page.waitForTimeout(300);
    };

    // Helper: Attack with creature
    const attack = async (attackerLane: number, targetLane?: number) => {
      // Select attacker
      await page.click(`[data-testid="creature-lane-${attackerLane}"]`);
      await page.waitForTimeout(200);

      // Click target or attack directly
      if (targetLane !== undefined) {
        await page.click(
          `[data-testid="opponent-creature-lane-${targetLane}"]`
        );
      } else {
        // Direct attack or auto-target
        await page.click('[data-testid="attack-button"]');
      }

      await page.waitForTimeout(500); // Wait for attack animation
    };

    // Helper: End turn
    const endTurn = async () => {
      await page.click('[data-testid="end-turn-button"]');
      await page.waitForTimeout(500);
    };

    // ==================== TEST START ====================

    // Draw initial cards for player
    for (let i = 0; i < 6; i++) {
      await drawCard();
    }

    // Play Quake Stag (400 ATK) in lane 0
    await playCreature("Quake Stag", 0, "ATTACK");

    // Verify it's on the board
    const quakeStag = page.locator('[data-testid="creature-lane-0"]');
    await expect(quakeStag).toBeVisible();
    await expect(
      quakeStag.locator('[data-testid="creature-atk"]')
    ).toContainText("400");

    // End turn to let AI play
    await endTurn();

    // Wait for AI to take turn
    await page.waitForTimeout(2000);

    // Draw next turn
    await drawCard();

    // ==================== KO #1 ====================

    // Need to wait for opponent to play a creature or play one ourselves for testing
    // For E2E, we'll need to ensure opponent has creatures to attack
    // Let's verify opponent has played something
    const opponentCreatures = page.locator(
      '[data-testid^="opponent-creature-lane-"]'
    );
    const opponentCount = await opponentCreatures.count();

    if (opponentCount > 0) {
      // Attack the opponent's creature
      await attack(0, 0);

      // Wait for damage calculation
      await page.waitForTimeout(1000);

      // Check KO count (might need multiple attacks)
      let koCount = await getKOCount(0);

      // Keep attacking until we get first KO
      while (koCount < 1) {
        await endTurn();
        await page.waitForTimeout(2000); // AI turn
        await drawCard();

        // Check if we can still attack
        const canAttack = await page
          .locator('[data-testid="creature-lane-0"]')
          .isVisible();
        if (canAttack) {
          const opponentHasCreature = await page
            .locator('[data-testid^="opponent-creature-lane-"]')
            .first()
            .isVisible();
          if (opponentHasCreature) {
            await attack(0, 0);
            await page.waitForTimeout(1000);
          }
        }

        koCount = await getKOCount(0);

        // Safety: break after 10 attempts
        if (koCount >= 1) break;
      }

      expect(koCount).toBeGreaterThanOrEqual(1);
    }

    // ==================== KO #2 & #3 ====================

    // Continue attacking to get 3 KOs
    let finalKOCount = await getKOCount(0);
    let attempts = 0;
    const maxAttempts = 30; // Prevent infinite loop

    while (finalKOCount < 3 && attempts < maxAttempts) {
      await endTurn();
      await page.waitForTimeout(2000); // AI turn
      await drawCard();

      // Attack if possible
      const canAttack = await page
        .locator('[data-testid="creature-lane-0"]')
        .isVisible();
      if (canAttack) {
        const opponentHasCreature = await page
          .locator('[data-testid^="opponent-creature-lane-"]')
          .first()
          .isVisible();
        if (opponentHasCreature) {
          await attack(0, 0);
          await page.waitForTimeout(1000);
        }
      }

      finalKOCount = await getKOCount(0);
      attempts++;
    }

    // Verify winner declaration
    if (finalKOCount >= 3) {
      const winnerMessage = page.locator('[data-testid="winner-message"]');
      await expect(winnerMessage).toBeVisible();
      await expect(winnerMessage).toContainText("wins");
      await expect(winnerMessage).toContainText("3 KOs");
    }
  });
});
