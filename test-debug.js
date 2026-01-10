// Quick debug script
const { createTestGame, drawMany } = require("./src/__tests__/testUtils");
const { CardType } = require("./src/cards");

const { p1, engine } = createTestGame();

drawMany(engine, 0, 10);

// Find cinder_vixen
const cinder = p1.hand.find((c) => c.id === "cinder_vixen");
console.log("Found cinder_vixen:", !!cinder);

if (cinder) {
  console.log("Before play - hasActivatedEffect:", cinder.hasActivatedEffect);
  console.log("Before play - hand size:", p1.hand.length);

  engine.playCreature(0, 0, cinder.id);

  const laneCreature = p1.lanes[0];
  console.log(
    "After play - hasActivatedEffect:",
    laneCreature.hasActivatedEffect
  );
  console.log("After play - hand size:", p1.hand.length);
  console.log(
    "After play - canActivateEffect:",
    laneCreature.canActivateEffect
  );
}
