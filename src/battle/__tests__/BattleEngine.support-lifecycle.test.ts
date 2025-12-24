import { BattleEngine } from "../BattleEngine";
import { cardFactory, createTestGame } from "../../__tests__/testUtils";
import { CardType } from "@cards";
import { CreatureCard } from "@cards/CreatureCard";
import { SupportCard } from "@cards/SupportCard";
import { ActionCard } from "@cards/ActionCard";

describe("BattleEngine – Support Card Lifecycle", () => {
  let engine: BattleEngine;

  beforeEach(() => {
    const testGame = createTestGame();
    engine = testGame.engine;
  });

  describe("Action Cards", () => {
    it("discards action cards immediately after activation", () => {
      const p1 = engine.state.players[0];
      engine.draw(0); // Enter MAIN phase

      // Create and play an action card
      const actionCard = cardFactory({
        id: "test_action",
        type: CardType.Action,
        name: "Test Action",
        effectId: "draw_on_play",
        effectType: "ONE_TIME",
      }) as ActionCard;

      p1.hand.push(actionCard);

      // Play action face-down
      const played = engine.playSupport(0, 0, actionCard.id);
      expect(played).toBe(true);
      expect(p1.support[0]).toBe(actionCard);
      expect(actionCard.isFaceDown).toBe(true);
      expect(actionCard.isActive).toBe(false);

      // Activate it
      engine.activateSupport(0, 0);

      // Should be discarded immediately
      expect(p1.support[0]).toBeNull();
      expect(p1.discardPile).toContain(actionCard);
    });
  });

  describe("Support Cards with ONE_TIME effects", () => {
    it("discards one-time support cards after activation", () => {
      const p1 = engine.state.players[0];
      engine.draw(0); // Enter MAIN phase

      const supportCard = cardFactory({
        id: "test_support_onetime",
        type: CardType.Support,
        name: "One Time Support",
        effectId: "draw_on_play",
        effectType: "ONE_TIME",
      }) as SupportCard;

      p1.hand.push(supportCard);

      // Play and activate
      engine.playSupport(0, 0, supportCard.id);
      engine.activateSupport(0, 0);

      // Should be discarded
      expect(p1.support[0]).toBeNull();
      expect(p1.discardPile).toContain(supportCard);
    });
  });

  describe("Persistent Support Cards (no target)", () => {
    it("keeps persistent supports on field indefinitely", () => {
      const p1 = engine.state.players[0];
      engine.draw(0); // Enter MAIN phase

      // Create a Fire creature to trigger the effect
      const fireCreature = cardFactory({
        id: "fire1",
        type: CardType.Creature,
        name: "Fire Creature",
        affinity: "FIRE",
        atk: 200,
        def: 200,
        hp: 500,
      }) as CreatureCard;

      p1.hand.push(fireCreature);
      engine.playCreature(0, 0, fireCreature.id, false, "ATTACK");

      // Create persistent support (affects all Fire creatures)
      const persistentSupport = cardFactory({
        id: "flame_aura",
        type: CardType.Support,
        name: "Flame Aura",
        effectId: "fire_atk_boost_aura",
        effectType: "CONTINUOUS",
      }) as SupportCard;

      p1.hand.push(persistentSupport);

      // Play and activate
      engine.playSupport(0, 1, persistentSupport.id);
      engine.activateSupport(0, 1);

      // Should remain on field
      expect(p1.support[1]).toBe(persistentSupport);
      expect(persistentSupport.isActive).toBe(true);
      expect(p1.discardPile).not.toContain(persistentSupport);

      // Even after ending turn
      engine.endTurn();
      expect(p1.support[1]).toBe(persistentSupport);
    });
  });

  describe("Targeted Support Cards", () => {
    it("tracks target information when support is activated with a target", () => {
      const p1 = engine.state.players[0];
      engine.draw(0); // Enter MAIN phase

      // Create Fire creature to target
      const fireCreature = cardFactory({
        id: "fire1",
        type: CardType.Creature,
        name: "Fire Creature",
        affinity: "FIRE",
        atk: 200,
        def: 200,
        hp: 500,
      }) as CreatureCard;

      p1.hand.push(fireCreature);
      engine.playCreature(0, 0, fireCreature.id, false, "ATTACK");

      // Create targeted support
      const targetedSupport = cardFactory({
        id: "ignite_burst",
        type: CardType.Support,
        name: "Ignite Burst",
        effectId: "boost_fire_and_extend_ignite",
        effectType: "CONTINUOUS",
      }) as SupportCard;

      p1.hand.push(targetedSupport);

      // Play and activate with target
      engine.playSupport(0, 1, targetedSupport.id);
      engine.activateSupport(0, 1, { targetLane: 0 }); // Target lane 0

      // Should track target info
      expect(targetedSupport.targetPlayerIndex).toBe(0);
      expect(targetedSupport.targetLane).toBe(0);
      expect(targetedSupport.targetCardId).toBe(fireCreature.id);
      expect(p1.support[1]).toBe(targetedSupport);
    });

    it("discards targeted support when target creature leaves field", () => {
      const p1 = engine.state.players[0];
      const p2 = engine.state.players[1];
      engine.draw(0); // Enter MAIN phase

      // P1 plays Fire creature
      const fireCreature = cardFactory({
        id: "fire1",
        type: CardType.Creature,
        name: "Fire Creature",
        affinity: "FIRE",
        atk: 200,
        def: 200,
        hp: 500,
        currentHp: 500,
      }) as CreatureCard;

      p1.hand.push(fireCreature);
      engine.playCreature(0, 0, fireCreature.id, false, "ATTACK");

      // P1 plays targeted support on that creature
      const targetedSupport = cardFactory({
        id: "ignite_burst",
        type: CardType.Support,
        name: "Ignite Burst",
        effectId: "boost_fire_and_extend_ignite",
        effectType: "CONTINUOUS",
      }) as SupportCard;

      p1.hand.push(targetedSupport);
      engine.playSupport(0, 1, targetedSupport.id);
      engine.activateSupport(0, 1, { targetLane: 0 });

      expect(p1.support[1]).toBe(targetedSupport);

      // P2 plays a strong attacker
      const strongAttacker = cardFactory({
        id: "attacker1",
        type: CardType.Creature,
        name: "Strong Attacker",
        atk: 600,
        def: 300,
        hp: 800,
        currentHp: 800,
      }) as CreatureCard;

      engine.endTurn(); // P2's turn
      engine.draw(1); // P2 draws
      p2.hand.push(strongAttacker);
      engine.playCreature(1, 0, strongAttacker.id, false, "ATTACK");
      engine.endTurn(); // Back to P1
      engine.draw(0); // P1 draws
      engine.endTurn(); // P2's turn again
      engine.draw(1); // P2 draws

      // P2 attacks and destroys P1's Fire creature
      engine.attack(1, 0, 0); // P2 lane 0 attacks P1 lane 0

      // Fire creature should be destroyed
      expect(p1.lanes[0]).toBeNull();
      expect(p1.discardPile).toContain(fireCreature);

      // Targeted support should also be discarded
      expect(p1.support[1]).toBeNull();
      expect(p1.discardPile).toContain(targetedSupport);
    });

    it("removes active effects when targeted support is discarded", () => {
      const p1 = engine.state.players[0];
      const p2 = engine.state.players[1];
      engine.draw(0); // Enter MAIN phase

      // P1 plays Fire creature
      const fireCreature = cardFactory({
        id: "fire1",
        type: CardType.Creature,
        name: "Fire Creature",
        affinity: "FIRE",
        atk: 200,
        def: 200,
        hp: 500,
        currentHp: 500,
      }) as CreatureCard;

      p1.hand.push(fireCreature);
      engine.playCreature(0, 0, fireCreature.id, false, "ATTACK");

      // P1 plays targeted support (boosts ATK +200)
      const targetedSupport = cardFactory({
        id: "ignite_burst",
        type: CardType.Support,
        name: "Ignite Burst",
        effectId: "boost_fire_and_extend_ignite",
        effectType: "CONTINUOUS",
      }) as SupportCard;

      p1.hand.push(targetedSupport);
      engine.playSupport(0, 1, targetedSupport.id);

      const initialAtk = (p1.lanes[0] as CreatureCard).atk;
      engine.activateSupport(0, 1, { targetLane: 0 });

      // Creature should have boosted ATK
      const boostedAtk = (p1.lanes[0] as CreatureCard).atk;
      expect(boostedAtk).toBe(initialAtk + 200);

      // Should have an active effect
      const activeEffectsForSupport = engine.state.activeEffects.filter(
        (e) => e.sourceCardId === targetedSupport.id
      );
      expect(activeEffectsForSupport.length).toBeGreaterThan(0);

      // P2 attacks and destroys the creature
      const strongAttacker = cardFactory({
        id: "attacker1",
        type: CardType.Creature,
        name: "Strong Attacker",
        atk: 600,
        def: 300,
        hp: 800,
        currentHp: 800,
      }) as CreatureCard;

      engine.endTurn();
      engine.draw(1);
      p2.hand.push(strongAttacker);
      engine.playCreature(1, 0, strongAttacker.id, false, "ATTACK");
      engine.endTurn();
      engine.draw(0);
      engine.endTurn();
      engine.draw(1);
      engine.attack(1, 0, 0);

      // Creature destroyed
      expect(p1.lanes[0]).toBeNull();

      // Support discarded
      expect(p1.support[1]).toBeNull();

      // Active effects should be removed
      const remainingEffects = engine.state.activeEffects.filter(
        (e) => e.sourceCardId === targetedSupport.id
      );
      expect(remainingEffects.length).toBe(0);
    });

    it("keeps targeted support when a different creature is destroyed", () => {
      const p1 = engine.state.players[0];
      const p2 = engine.state.players[1];
      engine.draw(0); // Enter MAIN phase

      // P1 plays two Fire creatures
      const fireCreature1 = cardFactory({
        id: "fire1",
        type: CardType.Creature,
        name: "Fire Creature 1",
        affinity: "FIRE",
        atk: 200,
        def: 200,
        hp: 500,
        currentHp: 500,
      }) as CreatureCard;

      const fireCreature2 = cardFactory({
        id: "fire2",
        type: CardType.Creature,
        name: "Fire Creature 2",
        affinity: "FIRE",
        atk: 300,
        def: 300,
        hp: 600,
        currentHp: 600,
      }) as CreatureCard;

      p1.hand.push(fireCreature1, fireCreature2);
      engine.playCreature(0, 0, fireCreature1.id, false, "ATTACK");
      engine.playCreature(0, 1, fireCreature2.id, false, "ATTACK");

      // P1 plays targeted support on creature in lane 0
      const targetedSupport = cardFactory({
        id: "ignite_burst",
        type: CardType.Support,
        name: "Ignite Burst",
        effectId: "boost_fire_and_extend_ignite",
        effectType: "CONTINUOUS",
      }) as SupportCard;

      p1.hand.push(targetedSupport);
      engine.playSupport(0, 2, targetedSupport.id);
      engine.activateSupport(0, 2, { targetLane: 0 }); // Target lane 0

      expect(p1.support[2]).toBe(targetedSupport);
      expect(targetedSupport.targetLane).toBe(0);

      // P2 plays attacker and destroys creature in lane 1 (not the target)
      const attacker = cardFactory({
        id: "attacker1",
        type: CardType.Creature,
        name: "Attacker",
        atk: 700,
        def: 300,
        hp: 800,
        currentHp: 800,
      }) as CreatureCard;

      engine.endTurn();
      engine.draw(1);
      p2.hand.push(attacker);
      engine.playCreature(1, 0, attacker.id, false, "ATTACK");
      engine.endTurn();
      engine.draw(0);
      engine.endTurn();
      engine.draw(1);
      engine.attack(1, 0, 1); // Attack lane 1, not lane 0

      // Creature in lane 1 destroyed
      expect(p1.lanes[1]).toBeNull();
      expect(p1.discardPile).toContain(fireCreature2);

      // But targeted support should STILL be active (targets lane 0)
      expect(p1.support[2]).toBe(targetedSupport);
      expect(p1.lanes[0]).toBe(fireCreature1); // Lane 0 creature still alive
    });
  });

  describe("Support removal by opponent effects", () => {
    it("discards support when removed by opponent's effect", () => {
      const p1 = engine.state.players[0];
      const p2 = engine.state.players[1];
      engine.draw(0); // Enter MAIN phase

      // P1 plays a support card
      const support = cardFactory({
        id: "flame_aura",
        type: CardType.Support,
        name: "Flame Aura",
        effectId: "fire_atk_boost_aura",
        effectType: "CONTINUOUS",
      }) as SupportCard;

      p1.hand.push(support);
      engine.playSupport(0, 0, support.id);
      engine.activateSupport(0, 0);

      expect(p1.support[0]).toBe(support);

      // P2 plays purge effect
      const purgeCard = cardFactory({
        id: "purge_beacon",
        type: CardType.Support,
        name: "Purge Beacon",
        effectId: "purge_opponent_support",
        effectType: "ONE_TIME",
      }) as SupportCard;

      engine.endTurn();
      engine.draw(1);
      p2.hand.push(purgeCard);
      engine.playSupport(1, 0, purgeCard.id);
      engine.activateSupport(1, 0, { targetLane: 0 }); // Target P1's slot 0

      // P1's support should be discarded
      expect(p1.support[0]).toBeNull();
      expect(p1.discardPile).toContain(support);

      // P2's purge card should also be discarded (ONE_TIME)
      expect(p2.support[0]).toBeNull();
      expect(p2.discardPile).toContain(purgeCard);
    });
  });

  describe("No manual discard", () => {
    it("does not allow players to manually discard supports", () => {
      const p1 = engine.state.players[0];
      engine.draw(0); // Enter MAIN phase

      const support = cardFactory({
        id: "test_support",
        type: CardType.Support,
        name: "Test Support",
        effectId: "fire_atk_boost_aura",
        effectType: "CONTINUOUS",
      }) as SupportCard;

      p1.hand.push(support);
      engine.playSupport(0, 0, support.id);
      engine.activateSupport(0, 0);

      expect(p1.support[0]).toBe(support);

      // There should be no method to manually discard
      // This test just verifies the support stays on field
      expect(p1.support[0]).toBe(support);
      expect(support.isActive).toBe(true);

      // Even after multiple turns
      engine.endTurn();
      engine.draw(1);
      engine.endTurn();
      engine.draw(0);

      expect(p1.support[0]).toBe(support);
    });
  });
});
