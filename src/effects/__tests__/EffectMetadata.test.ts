import {
  effectMetadata,
  getEffectMetadata,
  canActivateEffect,
} from "@effects/metadata";
import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";

/**
 * Effect Metadata Tests
 * Tests effect metadata structure and validation functions
 */
describe("Effects – Metadata", () => {
  it("has metadata registry", () => {
    expect(effectMetadata).toBeDefined();
    expect(typeof effectMetadata).toBe("object");
  });

  it("provides getEffectMetadata utility", () => {
    const effects = Object.keys(effectMetadata);

    if (effects.length > 0) {
      const metadata = getEffectMetadata(effects[0]);
      expect(metadata).toBeDefined();
      expect(metadata?.id).toBe(effects[0]);
    }
  });

  it("returns undefined for non-existent effect metadata", () => {
    const metadata = getEffectMetadata("non_existent_effect");
    expect(metadata).toBeUndefined();
  });

  it("validates effect metadata structure", () => {
    const effects = Object.values(effectMetadata);

    effects.forEach((metadata) => {
      expect(metadata).toHaveProperty("id");
      expect(metadata).toHaveProperty("name");
      expect(metadata).toHaveProperty("description");

      expect(typeof metadata.id).toBe("string");
      expect(typeof metadata.name).toBe("string");
      expect(typeof metadata.description).toBe("string");
    });
  });

  it("provides canActivate validation", () => {
    const p1 = createPlayerState("P1", []);
    const p2 = createPlayerState("P2", []);
    const game = createGameState(p1, p2);

    const effects = Object.keys(effectMetadata);

    effects.forEach((effectId) => {
      const result = canActivateEffect(effectId, game, 0);

      expect(result).toHaveProperty("canActivate");
      expect(typeof result.canActivate).toBe("boolean");

      if (result.reason) {
        expect(typeof result.reason).toBe("string");
      }
    });
  });

  it("handles canActivate for non-existent effects", () => {
    const p1 = createPlayerState("P1", []);
    const p2 = createPlayerState("P2", []);
    const game = createGameState(p1, p2);

    const result = canActivateEffect("non_existent_effect", game, 0);

    expect(result).toHaveProperty("canActivate");
    // Returns true when no metadata (no restrictions)
    expect(result.canActivate).toBe(true);
  });

  it("supports metadata with activation requirements", () => {
    const effects = Object.values(effectMetadata);

    effects.forEach((metadata) => {
      if (metadata.activationRequirements) {
        expect(Array.isArray(metadata.activationRequirements)).toBe(true);
      }
    });
  });

  it("supports metadata with targeting configuration", () => {
    const effects = Object.values(effectMetadata);

    effects.forEach((metadata) => {
      if (metadata.targeting) {
        expect(typeof metadata.targeting).toBe("object");
      }
    });
  });

  it("provides getValidTargets for targetable effects", () => {
    const p1 = createPlayerState("P1", []);
    const p2 = createPlayerState("P2", []);
    const game = createGameState(p1, p2);

    const effects = Object.values(effectMetadata);

    effects.forEach((metadata) => {
      if (metadata.getValidTargets) {
        const targets = metadata.getValidTargets(game, 0);

        expect(Array.isArray(targets)).toBe(true);

        targets.forEach((target) => {
          expect(target).toHaveProperty("label");
          expect(target).toHaveProperty("value");
          expect(typeof target.label).toBe("string");
          expect(typeof target.value).toBe("number");
        });
      }
    });
  });
});
