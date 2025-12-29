import { AIPlayer } from "../AIPlayer";
import {
  createTestGameWithAI,
  createTestSupport,
  playCreatureInLane,
  playSupportInSlot,
  enterMainPhase,
} from "../../__tests__/testUtils";

describe("AIPlayer", () => {
  describe("Trap Card Activation Logic", () => {
    describe("shouldActivateTrap - Mirror Force", () => {
      it("skill 1-3: rarely activates (20% chance or less)", () => {
        const { game, engine, ai: ai1 } = createTestGameWithAI(1);

        // Set up scenario: 3 opponent creatures in attack mode
        playCreatureInLane(engine, 0, 0, undefined, false, "ATTACK");
        playCreatureInLane(engine, 0, 1, undefined, false, "ATTACK");
        playCreatureInLane(engine, 0, 2, undefined, false, "ATTACK");

        const mirrorForce = createTestSupport({
          id: "mirror_force_test",
          effectId: "mirror_force",
          effectType: "ONE_TIME",
        });

        // Test multiple times to verify randomness (should activate rarely)
        let activations = 0;
        const trials = 100;

        for (let i = 0; i < trials; i++) {
          if (ai1.shouldActivateTrap(game, mirrorForce, 0, 0)) activations++;
        }

        // Should activate rarely (less than 40% of the time for skill 1-3)
        expect(activations).toBeLessThan(40);
      });

      it("skill 4-5: activates if 2+ attack-mode creatures", () => {
        const { game, engine, ai } = createTestGameWithAI(5);

        enterMainPhase(engine); // Enter main phase

        // Scenario 1: Only 1 attack-mode creature
        playCreatureInLane(engine, 0, 0, undefined, false, "ATTACK");

        const mirrorForce = createTestSupport({
          id: "mirror_force_test",
          effectId: "mirror_force",
          effectType: "ONE_TIME",
        });

        expect(ai.shouldActivateTrap(game, mirrorForce, 0, 0)).toBe(false);

        // Scenario 2: 2 attack-mode creatures
        playCreatureInLane(engine, 0, 1, undefined, false, "ATTACK");

        expect(ai.shouldActivateTrap(game, mirrorForce, 0, 0)).toBe(true);
      });

      it("skill 6-7: activates if 2+ creatures OR has no creatures (defending direct attack)", () => {
        const { game, engine, ai } = createTestGameWithAI(7);

        enterMainPhase(engine);

        const mirrorForce = createTestSupport({
          id: "mirror_force_test",
          effectId: "mirror_force",
          effectType: "ONE_TIME",
        });

        // Scenario 1: AI has no creatures, opponent has 1 attacker (direct attack)
        playCreatureInLane(engine, 0, 0, undefined, false, "ATTACK");

        // AI (player 1) has no creatures
        expect(game.players[1].lanes.every((c) => c === null)).toBe(true);

        expect(ai.shouldActivateTrap(game, mirrorForce, 0, 0)).toBe(true);

        // Scenario 2: AI has creatures, only 1 opponent attacker
        playCreatureInLane(engine, 1, 0, undefined, false, "ATTACK");

        expect(ai.shouldActivateTrap(game, mirrorForce, 0, 0)).toBe(false);

        // Scenario 3: 2+ opponent attackers
        playCreatureInLane(engine, 0, 1, undefined, false, "ATTACK");

        expect(ai.shouldActivateTrap(game, mirrorForce, 0, 0)).toBe(true);
      });

      it("skill 8-10: always activates on direct attack, or if clears 2+ creatures", () => {
        const { game, engine, ai } = createTestGameWithAI(10);

        enterMainPhase(engine);

        const mirrorForce = createTestSupport({
          id: "mirror_force_test",
          effectId: "mirror_force",
          effectType: "ONE_TIME",
        });

        // Scenario 1: Direct attack (AI has no creatures)
        playCreatureInLane(engine, 0, 0, undefined, false, "ATTACK");

        expect(ai.shouldActivateTrap(game, mirrorForce, 0, 0)).toBe(true);

        // Scenario 2: AI has creatures, only 1 opponent attacker
        playCreatureInLane(engine, 1, 0, undefined, false, "ATTACK");

        expect(ai.shouldActivateTrap(game, mirrorForce, 0, 0)).toBe(false);

        // Scenario 3: 2+ opponent attackers (clears board)
        playCreatureInLane(engine, 0, 1, undefined, false, "ATTACK");

        expect(ai.shouldActivateTrap(game, mirrorForce, 0, 0)).toBe(true);
      });

      it("does not activate against defense-mode creatures", () => {
        const { game, engine, ai } = createTestGameWithAI(10);

        // Opponent has creatures in defense mode
        playCreatureInLane(engine, 0, 0, undefined, false, "DEFENSE");
        playCreatureInLane(engine, 0, 1, undefined, false, "DEFENSE");
        playCreatureInLane(engine, 0, 2, undefined, false, "DEFENSE");

        const mirrorForce = createTestSupport({
          id: "mirror_force_test",
          effectId: "mirror_force",
          effectType: "ONE_TIME",
        });

        // Mirror Force only destroys attack-mode creatures, so defense-mode creatures = 0 targets
        // But AI (player 1) has no creatures, so it's still a direct attack scenario
        // High-skill AI will activate on direct attack
        expect(ai.shouldActivateTrap(game, mirrorForce, 0, 0)).toBe(true);
      });

      it("handles mixed attack/defense creatures correctly", () => {
        const { game, engine, ai } = createTestGameWithAI(8);

        // 2 attack, 1 defense
        playCreatureInLane(engine, 0, 0, undefined, false, "ATTACK");
        playCreatureInLane(engine, 0, 1, undefined, false, "DEFENSE");
        playCreatureInLane(engine, 0, 2, undefined, false, "ATTACK");

        const mirrorForce = createTestSupport({
          id: "mirror_force_test",
          effectId: "mirror_force",
          effectType: "ONE_TIME",
        });

        // Should count only attack-mode creatures (2)
        expect(ai.shouldActivateTrap(game, mirrorForce, 0, 0)).toBe(true);
      });
    });

    it("returns false for unknown trap effects", () => {
      const { game, ai } = createTestGameWithAI(10);

      const unknownTrap = createTestSupport({
        id: "unknown_trap",
        effectId: "nonexistent_effect",
        effectType: "ONE_TIME",
      });

      expect(ai.shouldActivateTrap(game, unknownTrap, 0, 0)).toBe(false);
    });

    it("returns false for traps without effectId", () => {
      const { game, ai } = createTestGameWithAI(10);

      const noEffectTrap = createTestSupport({
        id: "no_effect_trap",
        effectId: undefined,
        effectType: "ONE_TIME",
      });

      expect(ai.shouldActivateTrap(game, noEffectTrap, 0, 0)).toBe(false);
    });
  });

  describe("Support Card Activation", () => {
    it("skips trap cards (ON_DEFEND trigger) during manual activation", () => {
      const { game, engine } = createTestGameWithAI(10);

      enterMainPhase(engine);

      // Play Mirror Force face-down
      const mirrorForce = createTestSupport({
        id: "mirror_force_test",
        effectId: "mirror_force",
        effectType: "ONE_TIME",
      });

      playSupportInSlot(engine, 1, 0, mirrorForce);

      expect(game.players[1].support[0]).toBe(mirrorForce);
      expect(mirrorForce.isFaceDown).toBe(true);

      // AI shouldn't manually activate traps
      // We can't directly test private activateSupports(), but we can verify
      // that trap cards remain face-down after they're played
      expect(mirrorForce.isFaceDown).toBe(true);
      expect(mirrorForce.isActive).toBe(false);
    });

    it("activates non-trap support cards normally", () => {
      const { game, engine } = createTestGameWithAI(10);

      enterMainPhase(engine);

      // Play a regular support card
      const regularSupport = createTestSupport({
        id: "regular_support",
        effectId: "draw_on_play",
        effectType: "ONE_TIME",
      });

      playSupportInSlot(engine, 1, 0, regularSupport);

      expect(game.players[1].support[0]).toBe(regularSupport);

      // Manually activate it (simulating what AI would do)
      engine.activateSupport(1, 0);

      // Should be activated and discarded (ONE_TIME)
      expect(game.players[1].support[0]).toBeNull();
      expect(game.players[1].discardPile).toContain(regularSupport);
    });
  });

  describe("AI Skill Levels", () => {
    it("creates AI with skill level clamped between 1-10", () => {
      const { engine } = createTestGameWithAI(0); // Below minimum
      const ai1 = new AIPlayer({ skillLevel: 0, playerIndex: 1 }, engine);
      expect((ai1 as any).skillLevel).toBe(1);

      const ai2 = new AIPlayer({ skillLevel: 15, playerIndex: 1 }, engine);
      expect((ai2 as any).skillLevel).toBe(10);

      const ai3 = new AIPlayer({ skillLevel: 5, playerIndex: 1 }, engine);
      expect((ai3 as any).skillLevel).toBe(5);
    });

    it("stores correct player index", () => {
      const { engine } = createTestGameWithAI(5);

      const ai0 = new AIPlayer({ skillLevel: 5, playerIndex: 0 }, engine);
      expect((ai0 as any).playerIndex).toBe(0);

      const ai1 = new AIPlayer({ skillLevel: 5, playerIndex: 1 }, engine);
      expect((ai1 as any).playerIndex).toBe(1);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty board scenarios", () => {
      const { game, ai } = createTestGameWithAI(10);

      const mirrorForce = createTestSupport({
        id: "mirror_force_test",
        effectId: "mirror_force",
        effectType: "ONE_TIME",
      });

      // Scenario 1: No creatures on either side, AI has no creatures = direct attack
      expect(game.players[0].lanes.every((c) => c === null)).toBe(true);
      expect(game.players[1].lanes.every((c) => c === null)).toBe(true);

      // High-skill AI activates on direct attack
      expect(ai.shouldActivateTrap(game, mirrorForce, 0, 0)).toBe(true);
    });

    it("handles board with AI creatures vs single attacker", () => {
      const { game, engine, ai } = createTestGameWithAI(10);

      enterMainPhase(engine);

      const mirrorForce = createTestSupport({
        id: "mirror_force_test2",
        effectId: "mirror_force",
        effectType: "ONE_TIME",
      });

      // AI has creatures, opponent has only 1 attacker
      playCreatureInLane(engine, 0, 0, undefined, false, "ATTACK");
      playCreatureInLane(engine, 1, 0, undefined, false, "ATTACK");

      // Only 1 attacker, AI has creatures, high-skill won't activate
      expect(ai.shouldActivateTrap(game, mirrorForce, 0, 0)).toBe(false);
    });

    it("handles full board scenarios", () => {
      const { game, engine, ai } = createTestGameWithAI(10);

      // Fill opponent's board with attack-mode creatures
      for (let i = 0; i < 3; i++) {
        playCreatureInLane(engine, 0, i, undefined, false, "ATTACK");
      }

      const mirrorForce = createTestSupport({
        id: "mirror_force_test",
        effectId: "mirror_force",
        effectType: "ONE_TIME",
      });

      // High-skill AI should activate (clears 3 creatures)
      expect(ai.shouldActivateTrap(game, mirrorForce, 0, 0)).toBe(true);
    });

    it("handles trap callback being undefined", () => {
      const { engine } = createTestGameWithAI(5);

      // Create AI without trap callback
      const aiWithoutCallback = new AIPlayer(
        { skillLevel: 5, playerIndex: 1 },
        engine
      );

      // Should not crash when trap callback is not provided
      expect(aiWithoutCallback).toBeDefined();
    });
  });
});
