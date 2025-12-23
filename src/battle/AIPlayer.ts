import { GameState, getOpponentIndex } from "./GameState";
import { BattleEngine } from "./BattleEngine";
import { Card } from "../cards/Card";
import { CreatureCard } from "../cards/CreatureCard";
import { SupportCard } from "../cards/SupportCard";
import { ActionCard } from "../cards/ActionCard";
import { CardType } from "../cards/types";

export interface AIConfig {
  skillLevel: number; // 1-10
  playerIndex: 0 | 1;
}

export class AIPlayer {
  private skillLevel: number;
  private playerIndex: 0 | 1;
  private engine: BattleEngine;
  private onActionComplete?: () => void;

  constructor(
    config: AIConfig,
    engine: BattleEngine,
    onActionComplete?: () => void
  ) {
    this.skillLevel = Math.max(1, Math.min(10, config.skillLevel)); // Clamp 1-10
    this.playerIndex = config.playerIndex;
    this.engine = engine;
    this.onActionComplete = onActionComplete;
  }

  /**
   * Execute AI turn logic
   */
  async takeTurn(state: GameState): Promise<void> {
    if (state.activePlayer !== this.playerIndex) return;
    if (state.winnerIndex !== null) return;

    console.log(
      `[AI] Player ${this.playerIndex} taking turn (skill: ${this.skillLevel})`
    );

    // Add slight delay for visual effect
    await this.delay(500);

    // DRAW PHASE - AI must draw
    if (state.phase === "DRAW") {
      console.log("[AI] Draw phase - drawing card");
      this.engine.draw(this.playerIndex);
      // Don't call onActionComplete here - it would trigger a re-render mid-turn
      await this.delay(300);
      // After drawing, phase changes to MAIN automatically
    }

    // MAIN PHASE - AI makes strategic decisions
    // Re-check phase after drawing (it may have changed from DRAW to MAIN)
    if (state.phase === "MAIN") {
      console.log("[AI] Main phase - executing actions");
      await this.executeMainPhase(state);
    }

    // End turn
    console.log("[AI] Ending turn");
    this.engine.endTurn();
  }

  /**
   * Execute main phase logic based on skill level
   */
  private async executeMainPhase(state: GameState): Promise<void> {
    const player = state.players[this.playerIndex];
    const opponent = state.players[getOpponentIndex(this.playerIndex)];

    // 1. Play creatures (priority increases with skill)
    if (this.shouldPlayCreatures()) {
      await this.playCreatures(state);
    }

    // 2. Adjust creature modes strategically
    if (this.shouldAdjustModes()) {
      await this.adjustCreatureModes(state);
    }

    // 3. Play support/action cards (higher skill = better timing)
    if (this.shouldPlaySpells()) {
      await this.playSpells(state);
    }

    // 4. Activate face-down supports (strategic timing)
    if (this.shouldActivateSupports()) {
      await this.activateSupports(state);
    }

    // 5. Attack with creatures (skill affects targeting)
    await this.performAttacks(state);
  }

  /**
   * Play creature cards from hand
   */
  private async playCreatures(state: GameState): Promise<void> {
    const player = state.players[this.playerIndex];
    const creatures = player.hand.filter(
      (c) => c?.type === CardType.Creature
    ) as CreatureCard[];

    for (const creature of creatures) {
      const emptyLanes = player.lanes
        .map((c, i) => (c === null ? i : -1))
        .filter((i) => i >= 0);

      if (emptyLanes.length === 0) break;

      // Pick lane based on skill level
      const laneIndex = this.chooseLaneForCreature(state, creature, emptyLanes);

      if (this.engine.playCreature(this.playerIndex, laneIndex, creature.id)) {
        this.onActionComplete?.();
        await this.delay(400);

        // Lower skill = play fewer cards per turn
        if (this.skillLevel < 5 && Math.random() > 0.5) break;
      }
    }
  }

  /**
   * Choose which lane to play a creature in
   */
  private chooseLaneForCreature(
    state: GameState,
    creature: CreatureCard,
    emptyLanes: number[]
  ): number {
    const opponent = state.players[getOpponentIndex(this.playerIndex)];

    // Skill 1-3: Random placement
    if (this.skillLevel <= 3) {
      return emptyLanes[Math.floor(Math.random() * emptyLanes.length)];
    }

    // Skill 4-6: Prefer lanes opposite weak enemies
    if (this.skillLevel <= 6) {
      const weakLanes = emptyLanes.filter((i) => {
        const enemyCreature = opponent.lanes[i] as CreatureCard | null;
        return !enemyCreature || enemyCreature.def < creature.atk;
      });

      if (weakLanes.length > 0) {
        return weakLanes[Math.floor(Math.random() * weakLanes.length)];
      }
    }

    // Skill 7-10: Strategic placement considering all factors
    const scores = emptyLanes.map((laneIndex) => {
      let score = 0;
      const enemyCreature = opponent.lanes[laneIndex] as CreatureCard | null;

      if (enemyCreature) {
        // Can we beat this creature?
        if (creature.atk > enemyCreature.def) score += 3;
        // Will we survive counterattack?
        if (enemyCreature.atk <= creature.def) score += 2;
        // Target low HP creatures
        if (enemyCreature.currentHp < creature.atk) score += 4;
      } else {
        // Empty lane = direct attack opportunity
        score += 5;
      }

      return { laneIndex, score };
    });

    scores.sort((a, b) => b.score - a.score);

    // Skill 10 = perfect, 7-9 = mostly optimal
    const topChoices = this.skillLevel >= 9 ? 1 : Math.min(2, scores.length);
    return scores[Math.floor(Math.random() * topChoices)].laneIndex;
  }

  /**
   * Play support/action cards from hand
   */
  private async playSpells(state: GameState): Promise<void> {
    const player = state.players[this.playerIndex];
    const spells = player.hand.filter(
      (c) => c?.type === CardType.Support || c?.type === CardType.Action
    ) as (SupportCard | ActionCard)[];

    const emptySlots = player.support
      .map((c, i) => (c === null ? i : -1))
      .filter((i) => i >= 0);

    if (emptySlots.length === 0) return;

    for (const spell of spells) {
      if (emptySlots.length === 0) break;

      const slotIndex = emptySlots.shift()!;

      // Always play face down now
      if (this.engine.playSupport(this.playerIndex, slotIndex, spell.id)) {
        this.onActionComplete?.();
        await this.delay(400);

        // Lower skill = fewer spells per turn
        if (this.skillLevel < 6 && Math.random() > 0.4) break;
      }
    }
  }

  /**
   * Activate face-down support cards
   */
  private async activateSupports(state: GameState): Promise<void> {
    const player = state.players[this.playerIndex];

    for (let i = 0; i < player.support.length; i++) {
      const card = player.support[i];
      if (!card) continue;

      const spellCard = card as SupportCard | ActionCard;
      if (spellCard.isActive) continue;
      if (!spellCard.isFaceDown) continue; // Only activate face-down cards

      // Skill determines when to flip face-down cards
      if (this.shouldFlipSupport(state, i)) {
        this.engine.activateSupport(this.playerIndex, i);
        this.onActionComplete?.();
        await this.delay(300);
      }
    }
  }

  /**
   * Decide whether to flip a face-down support
   */
  private shouldFlipSupport(state: GameState, slot: number): boolean {
    // Skill 1-3: Very rarely flip (don't understand the strategy)
    if (this.skillLevel <= 3) return Math.random() < 0.15;

    // Skill 4-5: Sometimes flip
    if (this.skillLevel <= 5) return Math.random() < 0.3;

    // Skill 6-8: Flip sometimes
    if (this.skillLevel <= 8) return Math.random() < 0.4;

    // Skill 9-10: Flip strategically (simulate "right timing")
    return Math.random() < 0.6;
  }

  /**
   * Perform attacks with creatures
   */
  private async performAttacks(state: GameState): Promise<void> {
    const player = state.players[this.playerIndex];
    const opponent = state.players[getOpponentIndex(this.playerIndex)];

    for (let laneIndex = 0; laneIndex < player.lanes.length; laneIndex++) {
      const attacker = player.lanes[laneIndex] as CreatureCard | null;
      if (!attacker || attacker.hasAttackedThisTurn) continue;

      const target = this.chooseAttackTarget(state, laneIndex);

      if (target !== null) {
        this.engine.attack(this.playerIndex, laneIndex, target);
        this.onActionComplete?.();
        await this.delay(500);
      }
    }
  }

  /**
   * Choose which lane to attack
   */
  private chooseAttackTarget(
    state: GameState,
    attackerLane: number
  ): number | null {
    const player = state.players[this.playerIndex];
    const opponent = state.players[getOpponentIndex(this.playerIndex)];
    const attacker = player.lanes[attackerLane] as CreatureCard;
    const opponentIndex = getOpponentIndex(this.playerIndex);

    // Check if attacker is in defense mode - cannot attack
    if (attacker.mode === "DEFENSE") {
      return null;
    }

    // Check if we're at risk of losing (opponent needs 1 more KO to win)
    const aiKOs = state.koCount[this.playerIndex];
    const isAtRiskOfLosing = aiKOs >= 2; // If we have 2 KOs, one more means we lose

    // Check if opponent has any creatures at all
    const opponentCreatures = opponent.lanes.filter((c) => c !== null);
    const hasOpponentCreatures = opponentCreatures.length > 0;

    // If opponent has creatures, we MUST attack a creature (cannot attack empty lanes)
    if (hasOpponentCreatures) {
      // Skill 1-3: Attack same lane if it has a creature
      if (this.skillLevel <= 3) {
        const target = opponent.lanes[attackerLane];
        return target ? attackerLane : null;
      }

      // Skill 4-6: Attack any creature lane (prefer same lane)
      if (this.skillLevel <= 6) {
        const target = opponent.lanes[attackerLane];
        if (target) return attackerLane;

        // Find first lane with a creature
        const firstCreatureLane = opponent.lanes.findIndex((c) => c !== null);
        return firstCreatureLane !== -1 ? firstCreatureLane : null;
      }

      // Skill 7-10: Analyze all creature targets intelligently
      const possibleTargets: { lane: number; score: number }[] = [];

      for (let i = 0; i < opponent.lanes.length; i++) {
        const target = opponent.lanes[i] as CreatureCard | null;
        if (!target) continue; // Skip empty lanes when opponent has creatures

        let score = 0;

        // Calculate if we would destroy the target
        let wouldDestroyTarget = false;
        if (attacker.mode === "ATTACK" && target.mode === "ATTACK") {
          wouldDestroyTarget = attacker.atk >= target.currentHp;
          if (wouldDestroyTarget) score += 5;
        } else if (attacker.mode === "ATTACK" && target.mode === "DEFENSE") {
          const damageDealt = Math.max(0, attacker.atk - target.def);
          wouldDestroyTarget = damageDealt >= target.currentHp;
          if (wouldDestroyTarget) score += 5;
        }

        // Calculate if we would be destroyed in return
        let wouldBeDestroyed = false;
        if (target.mode === "ATTACK") {
          const counterDamage = Math.max(0, target.atk - attacker.atk);
          wouldBeDestroyed = counterDamage >= attacker.currentHp;
        }

        // CRITICAL: If we're at risk of losing (2 KOs), NEVER make an attack where we would be destroyed
        // unless we can guarantee destroying the target and it would give us a winning position
        if (isAtRiskOfLosing && wouldBeDestroyed) {
          // Only acceptable if we destroy them AND they're also at 2 KOs (mutual destruction = draw/stalemate)
          // OR if destroying this creature would give us a winning advantage
          const opponentKOs = state.koCount[opponentIndex];
          const isOpponentAlsoAtRisk = opponentKOs >= 2;

          if (!wouldDestroyTarget || !isOpponentAlsoAtRisk) {
            // This attack would lose us the game - absolutely avoid it
            score -= 1000; // Massive penalty
          }
        } else {
          // Normal case: avoid suicidal attacks (but not as critical)
          if (wouldBeDestroyed) {
            score -= 4;
          }
        }

        // Target low HP creatures
        score += (1000 - target.currentHp) / 200;

        possibleTargets.push({ lane: i, score });
      }

      possibleTargets.sort((a, b) => b.score - a.score);

      // If we're at risk of losing, filter out any targets with extremely negative scores (losing moves)
      const viableTargets = isAtRiskOfLosing
        ? possibleTargets.filter((t) => t.score > -500)
        : possibleTargets;

      // If no viable targets exist (all would lose the game), don't attack
      if (viableTargets.length === 0) {
        return null;
      }

      // Skill 9-10: Choose best target
      if (this.skillLevel >= 9 && viableTargets[0]) {
        return viableTargets[0].lane;
      }

      // Skill 7-8: Choose from top 2 targets
      const topTargets = viableTargets.slice(0, 2);
      if (topTargets.length > 0) {
        return topTargets[Math.floor(Math.random() * topTargets.length)].lane;
      }

      return null;
    }

    // Opponent has NO creatures - direct attack for KO point (any lane works, use lane 0)
    return 0;
  }

  /**
   * Skill-based decision: should play creatures?
   */
  private shouldPlayCreatures(): boolean {
    return Math.random() < 0.7 + this.skillLevel * 0.03;
  }

  /**
   * Skill-based decision: should adjust modes?
   */
  private shouldAdjustModes(): boolean {
    return this.skillLevel >= 4 && Math.random() < 0.5 + this.skillLevel * 0.03;
  }

  /**
   * Adjust creature modes based on strategy
   */
  private async adjustCreatureModes(state: GameState): Promise<void> {
    const player = state.players[this.playerIndex];
    const opponent = state.players[getOpponentIndex(this.playerIndex)];

    for (let laneIndex = 0; laneIndex < player.lanes.length; laneIndex++) {
      const creature = player.lanes[laneIndex] as CreatureCard | null;
      if (!creature) continue;

      const opponentCreature = opponent.lanes[laneIndex] as CreatureCard | null;

      // Skill 4-6: Basic mode decisions
      if (this.skillLevel <= 6) {
        // If opponent has stronger creature in same lane, go defense
        if (opponentCreature && opponentCreature.atk > creature.atk) {
          if (creature.mode === "ATTACK" && Math.random() < 0.6) {
            this.engine.toggleCreatureMode(this.playerIndex, laneIndex);
            this.onActionComplete?.();
            await this.delay(300);
          }
        }
      } else {
        // Skill 7-10: Strategic mode switching
        if (opponentCreature) {
          const inAttackMode = creature.mode === "ATTACK";

          // Calculate outcomes
          if (inAttackMode) {
            // In attack: both use ATK
            const wouldLose =
              opponentCreature.atk > creature.atk + creature.currentHp;
            // Switch to defense if we'd lose badly
            if (wouldLose && creature.def > creature.atk) {
              this.engine.toggleCreatureMode(this.playerIndex, laneIndex);
              this.onActionComplete?.();
              await this.delay(300);
            }
          } else {
            // In defense: use DEF
            const canSurvive = creature.def >= opponentCreature.atk;
            const shouldAttack = creature.atk > opponentCreature.atk;
            // Switch to attack if we can win
            if (canSurvive && shouldAttack && Math.random() < 0.7) {
              this.engine.toggleCreatureMode(this.playerIndex, laneIndex);
              this.onActionComplete?.();
              await this.delay(300);
            }
          }
        } else {
          // No opponent - prefer attack mode for direct attacks
          if (creature.mode === "DEFENSE" && Math.random() < 0.8) {
            this.engine.toggleCreatureMode(this.playerIndex, laneIndex);
            this.onActionComplete?.();
            await this.delay(300);
          }
        }
      }
    }
  }

  /**
   * Skill-based decision: should play spells?
   */
  private shouldPlaySpells(): boolean {
    return Math.random() < 0.4 + this.skillLevel * 0.05;
  }

  /**
   * Skill-based decision: should activate face-down supports?
   */
  private shouldActivateSupports(): boolean {
    return this.skillLevel >= 5 && Math.random() < 0.3 + this.skillLevel * 0.04;
  }

  /**
   * Helper: Add delay for visual pacing
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get AI skill level
   */
  getSkillLevel(): number {
    return this.skillLevel;
  }

  /**
   * Set AI skill level (1-10)
   */
  setSkillLevel(level: number): void {
    this.skillLevel = Math.max(1, Math.min(10, level));
  }
}
