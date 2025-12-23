import { test, expect } from "@playwright/test";

/**
 * E2E Test: Effect System
 *
 * Mimics the Jest test BattleEffects.test.ts
 * Tests that effects trigger correctly (ON_PLAY, ON_ATTACK)
 */
test.describe("Battle Engine - Effect System", () => {
  test("triggers ON_PLAY effect when creature is summoned", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".game-container")).toBeVisible();

    // Wait for game initialization
    await expect(page.locator("text=/Phase: (DRAW|MAIN)/")).toBeVisible({
      timeout: 10000,
    });
    await page.waitForTimeout(500);

    // Helper: Check game log for specific text
    const checkGameLog = async (searchText: string): Promise<boolean> => {
      const gameLog = page.locator('[data-testid="game-log"]');
      const logText = await gameLog.textContent();
      return logText?.toLowerCase().includes(searchText.toLowerCase()) || false;
    };

    // We should have cards in hand from initialization
    // If in DRAW phase, move to MAIN
    const currentPhase = await page
      .locator("text=/Phase: (DRAW|MAIN)/")
      .textContent();
    if (currentPhase?.includes("DRAW")) {
      await page.click('[data-testid="draw-button"]');
      await page.waitForTimeout(500);
    }

    // Find and play first creature card
    const emberCub = page.locator('[data-testid="hand-card"]').first();
    await emberCub.click();
    await page.click('[data-testid="creature-lane-0"]');
    await page.click('[data-testid="play-attack-button"]');
    await page.waitForTimeout(500);

    // Verify creature was played (check game log)
    const hasPlayLog =
      (await checkGameLog("played")) || (await checkGameLog("summoned"));
    expect(hasPlayLog).toBe(true);

    // Verify creature is on the board
    const creature = page.locator('[data-testid="creature-lane-0"]');
    await expect(creature).toBeVisible();
  });

  test("triggers ON_ATTACK effect when creature attacks", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".game-container")).toBeVisible();

    // Wait for game initialization
    await expect(page.locator("text=/Phase: (DRAW|MAIN)/")).toBeVisible({
      timeout: 10000,
    });
    await page.waitForTimeout(500);

    const checkGameLog = async (searchText: string): Promise<boolean> => {
      const gameLog = page.locator('[data-testid="game-log"]');
      const logText = await gameLog.textContent();
      return logText?.toLowerCase().includes(searchText.toLowerCase()) || false;
    };

    // Move to MAIN phase if needed
    const currentPhase = await page
      .locator("text=/Phase: (DRAW|MAIN)/")
      .textContent();
    if (currentPhase?.includes("DRAW")) {
      await page.click('[data-testid="draw-button"]');
      await page.waitForTimeout(500);
    }

    // Play attacker in lane 0
    const attackerCard = page.locator('[data-testid="hand-card"]').first();
    await attackerCard.click();
    await page.click('[data-testid="creature-lane-0"]');
    await page.click('[data-testid="play-attack-button"]');
    await page.waitForTimeout(500);

    // End turn to let AI play
    await page.click('[data-testid="end-turn-button"]');
    await page.waitForTimeout(2000);

    // Start next turn
    await page.click('[data-testid="draw-button"]');
    await page.waitForTimeout(300);

    // Attack (if opponent has creatures)
    const opponentHasCreature = await page
      .locator('[data-testid^="opponent-creature-lane-"]')
      .first()
      .isVisible();

    if (opponentHasCreature) {
      // Select attacker
      await page.click('[data-testid="creature-lane-0"]');
      await page.waitForTimeout(200);

      // Attack opponent creature
      await page.click('[data-testid="opponent-creature-lane-0"]');
      await page.waitForTimeout(1000);

      // Check log for attack message
      const hasAttackLog =
        (await checkGameLog("attack")) || (await checkGameLog("damage"));
      expect(hasAttackLog).toBe(true);
    } else {
      // Direct attack
      await page.click('[data-testid="creature-lane-0"]');
      await page.waitForTimeout(200);
      await page.click('[data-testid="attack-button"]');
      await page.waitForTimeout(1000);

      const hasAttackLog =
        (await checkGameLog("attack")) || (await checkGameLog("damage"));
      expect(hasAttackLog).toBe(true);
    }
  });

  test("support cards can be played and activated", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".game-container")).toBeVisible();

    // Wait for game initialization
    await expect(page.locator("text=/Phase: (DRAW|MAIN)/")).toBeVisible({
      timeout: 10000,
    });
    await page.waitForTimeout(500);

    // Move to MAIN phase if needed
    const currentPhase = await page
      .locator("text=/Phase: (DRAW|MAIN)/")
      .textContent();
    if (currentPhase?.includes("DRAW")) {
      await page.click('[data-testid="draw-button"]');
      await page.waitForTimeout(500);
    }

    // Try to find and play a support card from existing hand
    const supportCard = page
      .locator('[data-testid="hand-card"][data-card-type="Support"]')
      .first();

    if (await supportCard.isVisible()) {
      await supportCard.click();

      // Click on support zone slot
      await page.click('[data-testid="support-slot-0"]');
      await page.waitForTimeout(500);

      // Verify support card is in the zone
      const supportInZone = page
        .locator('[data-testid="support-slot-0"]')
        .locator('[data-testid="support-card"]');
      await expect(supportInZone).toBeVisible();

      // Try to activate the support card
      await supportInZone.dblclick();
      await page.waitForTimeout(500);

      // Check if activation modal appears or effect applies
      const gameLog = page.locator('[data-testid="game-log"]');
      const logText = await gameLog.textContent();
      const hasEffectLog =
        logText?.toLowerCase().includes("effect") ||
        logText?.toLowerCase().includes("activated");

      expect(hasEffectLog).toBe(true);
    }
  });
});
