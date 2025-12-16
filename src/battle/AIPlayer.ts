import { GameState } from "./GameState";
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

  constructor(config: AIConfig, engine: BattleEngine) {
    this.skillLevel = Math.max(1, Math.min(10, config.skillLevel)); // Clamp 1-10
    this.playerIndex = config.playerIndex;
    this.engine = engine;
  }

  /**
   * Execute AI turn logic
   */
  async takeTurn(state: GameState): Promise<void> {
    if (state.currentPlayerIndex !== this.playerIndex) return;
    if (state.winnerIndex !== null) return;

    // Add slight delay for visual effect
    await this.delay(500);

    // DRAW PHASE - AI must draw
    if (state.phase === "DRAW") {
      this.engine.draw(this.playerIndex);
      await this.delay(300);
    }

    // MAIN PHASE - AI makes strategic decisions
    if (state.phase === "MAIN") {
      await this.executeMainPhase(state);
    }

    // End turn
    this.engine.endTurn();
  }

  /**
   * Execute main phase logic based on skill level
   */
  private async executeMainPhase(state: GameState): Promise<void> {
    const player = state.players[this.playerIndex];
    const opponent = state.players[this.playerIndex === 0 ? 1 : 0];

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
    const opponent = state.players[this.playerIndex === 0 ? 1 : 0];

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

      // Skill determines face-down vs instant activate
      const shouldActivate = this.shouldActivateSpellImmediately(state, spell);

      if (
        this.engine.playSupport(
          this.playerIndex,
          spell.id,
          slotIndex,
          shouldActivate
        )
      ) {
        await this.delay(400);

        // Lower skill = fewer spells per turn
        if (this.skillLevel < 6 && Math.random() > 0.4) break;
      }
    }
  }

  /**
   * Decide whether to activate spell immediately or set face-down
   */
  private shouldActivateSpellImmediately(
    state: GameState,
    spell: SupportCard | ActionCard
  ): boolean {
    // Skill 1-4: Usually activate immediately (don't understand face-down strategy)
    if (this.skillLevel <= 4) return Math.random() > 0.3;

    // Skill 5-7: Sometimes set face-down for bluffing
    if (this.skillLevel <= 7) return Math.random() > 0.5;

    // Skill 8-10: Strategic decision based on game state
    // Support cards (continuous) = set face-down more often
    if (spell.type === CardType.Support) return Math.random() > 0.6;

    // Action cards = activate when needed
    return Math.random() > 0.4;
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

      // Skill determines when to flip face-down cards
      if (this.shouldFlipSupport(state, i)) {
        this.engine.activateSupport(this.playerIndex, i);
        await this.delay(300);
      }
    }
  }

  /**
   * Decide whether to flip a face-down support
   */
  private shouldFlipSupport(state: GameState, slot: number): boolean {
    // Skill 1-5: Rarely flip (don't understand the strategy)
    if (this.skillLevel <= 5) return Math.random() < 0.2;

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
    const opponent = state.players[this.playerIndex === 0 ? 1 : 0];

    for (let laneIndex = 0; laneIndex < player.lanes.length; laneIndex++) {
      const attacker = player.lanes[laneIndex] as CreatureCard | null;
      if (!attacker || attacker.hasAttackedThisTurn) continue;

      const target = this.chooseAttackTarget(state, laneIndex);

      if (target !== null) {
        this.engine.attack(this.playerIndex, laneIndex);
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
    const opponent = state.players[this.playerIndex === 0 ? 1 : 0];
    const attacker = player.lanes[attackerLane] as CreatureCard;

    // Skill 1-3: Attack same lane only
    if (this.skillLevel <= 3) {
      const target = opponent.lanes[attackerLane];
      return target ? attackerLane : null;
    }

    // Skill 4-6: Attack same lane or direct if empty
    if (this.skillLevel <= 6) {
      return attackerLane;
    }

    // Skill 7-10: Analyze all possible targets
    const possibleTargets: { lane: number; score: number }[] = [];

    for (let i = 0; i < opponent.lanes.length; i++) {
      const target = opponent.lanes[i] as CreatureCard | null;
      let score = 0;

      if (target) {
        // Can we destroy it?
        if (attacker.atk - target.def >= target.currentHp) score += 5;
        // Can we damage it safely?
        if (attacker.atk > target.def && target.atk <= attacker.def) score += 3;
        // Target low HP creatures
        score += (1000 - target.currentHp) / 200;
        // Avoid suicidal attacks
        if (target.atk - attacker.def >= attacker.currentHp) score -= 4;
      } else {
        // Direct attack = KO point
        score += 6;
      }

      possibleTargets.push({ lane: i, score });
    }

    possibleTargets.sort((a, b) => b.score - a.score);

    // Skill 9-10: Choose best target
    if (this.skillLevel >= 9 && possibleTargets[0].score > 0) {
      return possibleTargets[0].lane;
    }

    // Skill 7-8: Choose from top 2 targets
    const topTargets = possibleTargets.filter((t) => t.score > 0).slice(0, 2);
    if (topTargets.length > 0) {
      return topTargets[Math.floor(Math.random() * topTargets.length)].lane;
    }

    // Default: attack same lane if any target available
    return attackerLane;
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
    const opponent = state.players[this.playerIndex === 0 ? 1 : 0];

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
              await this.delay(300);
            }
          } else {
            // In defense: use DEF
            const canSurvive = creature.def >= opponentCreature.atk;
            const shouldAttack = creature.atk > opponentCreature.atk;
            // Switch to attack if we can win
            if (canSurvive && shouldAttack && Math.random() < 0.7) {
              this.engine.toggleCreatureMode(this.playerIndex, laneIndex);
              await this.delay(300);
            }
          }
        } else {
          // No opponent - prefer attack mode for direct attacks
          if (creature.mode === "DEFENSE" && Math.random() < 0.8) {
            this.engine.toggleCreatureMode(this.playerIndex, laneIndex);
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
