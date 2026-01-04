import { effectsRegistry } from "@effects/registry";

/**
 * Effect Registry Tests
 * Tests the effect registry structure and data integrity
 */
describe("Effects – Registry", () => {
  it("loads effects from data.json", () => {
    expect(effectsRegistry).toBeDefined();
    expect(typeof effectsRegistry).toBe("object");
  });

  it("has valid effect structure for all entries", () => {
    const effects = Object.values(effectsRegistry);

    expect(effects.length).toBeGreaterThan(0);

    effects.forEach((effect) => {
      expect(effect).toHaveProperty("id");
      expect(effect).toHaveProperty("name");
      expect(effect).toHaveProperty("trigger");

      // Validate types
      expect(typeof effect.id).toBe("string");
      expect(typeof effect.name).toBe("string");
      expect(typeof effect.trigger).toBe("string");
    });
  });

  it("has unique effect IDs", () => {
    const effects = Object.values(effectsRegistry);
    const ids = effects.map((e) => e.id);
    const uniqueIds = new Set(ids);

    expect(ids.length).toBe(uniqueIds.size);
  });

  it("maps effect IDs to their definitions", () => {
    const effects = Object.values(effectsRegistry);

    effects.forEach((effect) => {
      expect(effectsRegistry[effect.id]).toBe(effect);
    });
  });

  it("has valid trigger types", () => {
    const validTriggers = [
      "ON_PLAY",
      "ON_ATTACK",
      "ON_DEFEND",
      "ON_DESTROY",
      "ON_DRAW",
      "CONTINUOUS",
      "MANUAL",
    ];

    const effects = Object.values(effectsRegistry);

    effects.forEach((effect) => {
      expect(validTriggers).toContain(effect.trigger);
    });
  });

  it("supports lookup by effect ID", () => {
    const effects = Object.values(effectsRegistry);

    if (effects.length > 0) {
      const firstEffect = effects[0];
      const lookedUp = effectsRegistry[firstEffect.id];

      expect(lookedUp).toBeDefined();
      expect(lookedUp).toBe(firstEffect);
    }
  });

  it("returns undefined for non-existent effect IDs", () => {
    const nonExistent = effectsRegistry["this_effect_does_not_exist"];
    expect(nonExistent).toBeUndefined();
  });
});
