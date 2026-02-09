import { GameState, getOpponentIndex, ActiveEffect } from "./GameState";
import { CardInterface, CardType, CreatureCard } from "../cards";
import { ActionCard } from "../cards/ActionCard";
import { TrapCard } from "../cards/TrapCard";
import { moveCard } from "./ZoneEngine";
import { Zone } from "./zones";
import { resolveEffectsForCard } from "../effects/resolve";
import { effectsRegistry, getEffectTiming } from "../effects/registry";
import { canActivateEffect } from "../effects/metadata";
import {
  CommandResult,
  CommandErrorCode,
  createError,
  createSuccess,
  validateMomentumCost,
} from "./CommandTypes";
import {
  createMomentumBuffEffect,
  getEffectiveStatsFromActiveEffects,
} from "./MomentumBuff";

export class BattleEngine {
  public onEffectActivated?: (card: CardInterface, effectName: string) => void;

  constructor(public state: GameState) {}

  // Legacy log method for simple strings (maintains compatibility)
  log(msg: string) {
    this.state.log.info(this.state.turn, this.state.phase, msg);
  }

  /**
   * Normalizes a card when it enters the discard pile.
   * Cards in discard should always be face-up and in attack mode (for creatures).
   */
  private normalizeCardForDiscard<T extends CardInterface>(card: T): T {
    const normalized = { ...card } as any;

    // Always face up in discard
    if ("isFaceDown" in normalized) {
      normalized.isFaceDown = false;
    }

    // Creatures should be in attack mode
    if ("mode" in normalized) {
      normalized.mode = "ATTACK";
    }

    // Action/Trap cards should not be active
    if ("isActive" in normalized) {
      normalized.isActive = false;
    }

    return normalized as T;
  }

  // Access to the full logger for structured events
  get logger() {
    return this.state.log;
  }

  // Momentum System: Gain momentum with 0-10 hard cap
  gainMomentum(playerIndex: number, amount: number) {
    const player = this.state.players[playerIndex];
    const oldMomentum = player.momentum;
    player.momentum = Math.min(10, player.momentum + amount);
    const gained = player.momentum - oldMomentum;
    if (gained > 0) {
      this.log(
        `${player.id} gained ${gained} Momentum! (${player.momentum}/10)`,
      );
    }
    // Update momentum pressure effect
    this.syncMomentumEffects(playerIndex);
  }

  /**
   * Spend momentum (reduces momentum and applies Momentum Pressure adjustments).
   * Used when playing cards or activating effects that cost momentum.
   */
  private spendMomentum(playerIndex: number, amount: number) {
    const player = this.state.players[playerIndex];
    player.momentum = Math.max(0, player.momentum - amount);
    // Update momentum pressure effect
    this.syncMomentumEffects(playerIndex);
  }

  /**
   * Synchronizes the momentum pressure effect for a player.
   * Removes old momentum effect and creates a new one based on current momentum.
   * Only creates an effect if momentum >= 3 (i.e., there's an actual buff to apply).
   */
  public syncMomentumEffects(playerIndex: number) {
    const player = this.state.players[playerIndex];

    // Remove existing momentum effect for this player
    this.state.activeEffects = this.state.activeEffects.filter(
      (effect) =>
        !(effect.isMomentumEffect && effect.playerIndex === playerIndex),
    );

    // Only create effect if there's an actual buff (momentum >= 3)
    if (player.momentum >= 3) {
      const newEffect = createMomentumBuffEffect(
        playerIndex as 0 | 1,
        player.momentum,
      );
      this.state.activeEffects.push(newEffect);
    }
  }

  /**
   * Get effective ATK for a creature with Momentum Pressure applied.
   * This should be used for all combat calculations.
   */
  private getEffectiveAtk(creature: CreatureCard, playerIndex: number): number {
    const stats = getEffectiveStatsFromActiveEffects(
      creature,
      this.state.activeEffects,
      playerIndex as 0 | 1,
    );
    return stats.atk;
  }

  /**
   * Get effective DEF for a creature with Momentum Pressure applied.
   * This should be used for all combat calculations.
   */
  private getEffectiveDef(creature: CreatureCard, playerIndex: number): number {
    const stats = getEffectiveStatsFromActiveEffects(
      creature,
      this.state.activeEffects,
      playerIndex as 0 | 1,
    );
    return stats.def;
  }

  draw(playerIndex: number) {
    // Do not draw if the game is already won
    if (this.state.winnerIndex !== null) return;

    const player = this.state.players[playerIndex];
    const topCard = player.deck?.[0] as CardInterface | undefined;

    if (!topCard) {
      this.log(`${player.id} has no cards left to draw.`);
      // Mark that player has drawn this turn (even though deck is empty)
      this.state.hasDrawnThisTurn = true;

      // Automatically move to main phase
      if (this.state.phase === "DRAW") {
        this.state.phase = "MAIN";
        this.logger.phaseChange(this.state.turn, "MAIN", "Main Phase begins");
      }
      return;
    }

    // Move from Deck → Hand
    player.deck.shift();
    player.hand.push(topCard);

    // Structured log for card draw
    this.logger.cardDrawn(
      this.state.turn,
      this.state.phase,
      playerIndex as 0 | 1,
      player.id,
      topCard.id,
      topCard.name,
      player.deck.length,
      this.state, // Pass state for snapshot
    );

    // Mark that player has drawn this turn
    this.state.hasDrawnThisTurn = true;

    // Automatically move to main phase after drawing
    if (this.state.phase === "DRAW") {
      this.state.phase = "MAIN";
      this.logger.phaseChange(
        this.state.turn,
        "MAIN",
        "Main Phase begins",
        this.state, // Pass state for snapshot
      );
    }

    resolveEffectsForCard({
      state: this.state,
      ownerIndex: playerIndex as 0 | 1,
      trigger: "ON_DRAW",
      cardEffectId: topCard.effectId,
      onEffectActivated: this.onEffectActivated,
    });
  }

  playCreature(
    playerIndex: number,
    lane: number,
    cardId: string,
    faceDown: boolean = false,
    mode: "ATTACK" | "DEFENSE" = "ATTACK",
  ): boolean {
    // Must be in main phase to play cards
    if (this.state.phase !== "MAIN") {
      this.log("Cannot play cards during draw phase. Draw a card first!");
      return false;
    }

    const player = this.state.players[playerIndex];

    // Check if card is in hand OR in maxDeck
    let card = player.hand.find((c) => c.id === cardId);
    let isFromMaxDeck = false;

    if (!card) {
      card = player.maxDeck.find((c) => c.id === cardId);
      isFromMaxDeck = true;
    }

    if (!card || card.type !== CardType.Creature) return false;
    if (player.lanes[lane] !== null) return false;

    // COST VALIDATION: Check if player can afford the card
    const cardCost = card.cost ?? 0;
    if (player.momentum < cardCost) {
      this.log(
        `Not enough momentum to play ${card.name}. Need ${cardCost}, have ${player.momentum}.`,
      );
      return false;
    }

    // COST PAYMENT: Deduct momentum cost BEFORE playing the card
    if (cardCost > 0) {
      this.log(
        `${player.id} spent ${cardCost} Momentum to play ${card.name}! (${
          player.momentum - cardCost
        }/10 remaining)`,
      );
      this.spendMomentum(playerIndex, cardCost);
    }

    // Move from appropriate zone
    const fromZone = isFromMaxDeck ? Zone.MaxDeck : Zone.Hand;
    moveCard(this.state, playerIndex, fromZone, Zone.Lane0, cardId, {
      toLane: lane,
    });

    const creature = player.lanes[lane]!;
    // Regenerate instanceId to ensure uniqueness when played
    creature.instanceId = `${creature.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    creature.isFaceDown = faceDown;
    creature.mode = mode;

    // Structured log for card played
    this.logger.cardPlayed(
      this.state.turn,
      this.state.phase,
      playerIndex as 0 | 1,
      player.id,
      { id: card.id, name: card.name, type: "Creature" },
      { lane, faceDown, mode },
    );

    // Apply any persistent active effects (supports/global buffs) to this creature
    this.applyActiveEffectsToCreature(playerIndex as 0 | 1, creature);

    // Note: Creature effects are NOT auto-triggered on play.
    // They must be manually activated by clicking the creature after it's on the field.

    return true;
  }

  playSupport(playerIndex: 0 | 1, slot: number, cardId: string): boolean {
    if (this.state.winnerIndex !== null) return false;

    // Must be in main phase to play cards
    if (this.state.phase !== "MAIN") {
      this.log("Cannot play cards during draw phase. Draw a card first!");
      return false;
    }

    const player = this.state.players[playerIndex];

    // 3 support slots
    if (slot < 0 || slot > 2) return false;
    if (player.support[slot] !== null) return false;

    const card = player.hand.find((c) => c.id === cardId);
    if (!card || (card.type !== CardType.Action && card.type !== CardType.Trap))
      return false;

    // Support cards can be played facedown without momentum cost
    // The cost is only paid when the card is activated

    moveCard(this.state, playerIndex, Zone.Hand, Zone.Support0, cardId, {
      toLane: slot,
    });

    const spellCard = player.support[slot]! as ActionCard | TrapCard;

    // Always play face down and inactive
    spellCard.isActive = false;
    spellCard.isFaceDown = true;

    this.logger.cardPlayed(
      this.state.turn,
      this.state.phase,
      playerIndex,
      player.id,
      { id: cardId, name: card.name },
      { slot, faceDown: true },
    );

    this.log(
      `${
        player.id
      } set ${card.type.toLowerCase()} card face-down to support slot ${slot}`,
    );

    return true;
  }

  /**
   * Sacrifice: Destroy your own creature to gain Momentum
   * Cannot sacrifice if creature attacked this turn
   * Cannot sacrifice MAX creatures
   * Momentum gain: cost 1-2 → +1, cost 3-4 → +2, cost 5+ → +3
   */
  sacrifice(playerIndex: 0 | 1, lane: number): boolean {
    if (this.state.winnerIndex !== null) return false;

    // Must be in main phase
    if (this.state.phase !== "MAIN") {
      this.log("Cannot sacrifice during draw phase.");
      return false;
    }

    const player = this.state.players[playerIndex];
    const creature = player.lanes[lane];

    if (!creature) {
      this.log("No creature in that lane to sacrifice.");
      return false;
    }

    // Cannot sacrifice if creature attacked this turn
    if (creature.hasAttackedThisTurn) {
      this.log(
        `${creature.name} cannot be sacrificed after attacking this turn!`,
      );
      return false;
    }

    // Cannot sacrifice MAX creatures
    if (creature.isMax) {
      this.log("MAX creatures cannot be sacrificed!");
      return false;
    }

    // Calculate Momentum gain based on cost tier
    const cost = creature.cost;
    let momentumGain = 0;
    if (cost >= 5) {
      momentumGain = 3;
    } else if (cost >= 3) {
      momentumGain = 2;
    } else {
      momentumGain = 1;
    }

    // Remove creature from field
    player.lanes[lane] = null;
    player.discardPile = [
      ...player.discardPile,
      this.normalizeCardForDiscard(creature),
    ];

    this.log(`${player.id} sacrificed ${creature.name}!`);
    this.gainMomentum(playerIndex, momentumGain);

    // Remove any support cards targeting this creature
    this.checkAndRemoveTargetedSupports(playerIndex, lane, creature.instanceId);

    return true;
  }

  /**
   * Activate a creature's effect from its lane
   * Creatures with effects can activate them once per game (ONE_TIME) or multiple times (CONTINUOUS)
   */
  activateCreatureEffect(
    playerIndex: 0 | 1,
    lane: number,
    eventData?: { targetLane?: number; targetPlayer?: 0 | 1 },
  ): boolean {
    if (this.state.winnerIndex !== null) return false;

    // Must be in main phase
    if (this.state.phase !== "MAIN") {
      this.log("Cannot activate effects during draw phase. Draw a card first!");
      return false;
    }

    const player = this.state.players[playerIndex];
    const creature = player.lanes[lane];

    if (!creature || creature.type !== CardType.Creature) {
      this.log("No creature in that lane!");
      return false;
    }

    if (!creature.effectId) {
      this.log(`${creature.name} has no activatable effect!`);
      return false;
    }

    // Check if effect can be activated
    if (!creature.canActivateEffect) {
      this.log(
        `${creature.name}'s effect has already been activated and can only be used once!`,
      );
      return false;
    }

    // Use metadata system to check activation requirements
    const activationCheck = canActivateEffect(
      creature.effectId,
      this.state,
      playerIndex,
    );

    if (!activationCheck.canActivate) {
      this.log(
        `${creature.name}'s effect cannot be activated - ${
          activationCheck.reason || "requirements not met"
        }`,
      );
      return false;
    }

    // Mark as activated for ONE_TIME effects
    const effectTiming = getEffectTiming(creature);
    if (effectTiming === "ONE_TIME") {
      creature.hasActivatedEffect = true;
    }

    // Mark as activated this turn (for all effect types)
    creature.hasActivatedEffectThisTurn = true;

    // Resolve the effect
    resolveEffectsForCard({
      state: this.state,
      engine: this,
      sourceCard: creature,
      ownerIndex: playerIndex,
      cardEffectId: creature.effectId,
      trigger: "ON_PLAY", // Treat creature effect activation like support activation
      eventData,
      onEffectActivated: this.onEffectActivated,
    });

    this.logger.cardActivated(
      this.state.turn,
      this.state.phase,
      playerIndex,
      player.id,
      { id: creature.id, name: creature.name },
      lane,
    );

    this.log(
      `${player.id} activated ${creature.name}'s effect from lane ${lane}${
        effectTiming === "ONE_TIME" ? " (one-time effect)" : ""
      }`,
    );

    return true;
  }

  /**
   * Activates a support or action card from a face-down state
   *
   * Action cards: Always discarded after activation
   * Support cards with targets: Stay active until target leaves field
   * Support cards without targets (persistent): Stay active indefinitely
   */
  activateSupport(
    playerIndex: 0 | 1,
    slot: number,
    eventData?: { lane?: number; targetLane?: number; targetPlayer?: 0 | 1 },
  ): boolean {
    if (this.state.winnerIndex !== null) return false;

    // Must be in main phase
    if (this.state.phase !== "MAIN") {
      this.log("Cannot activate cards during draw phase. Draw a card first!");
      return false;
    }

    const player = this.state.players[playerIndex];
    const card = player.support[slot] as ActionCard | TrapCard | null;

    if (!card || (card.type !== CardType.Action && card.type !== CardType.Trap))
      return false;

    if (card.isActive) {
      this.log(`${card.name} is already active!`);
      return false;
    }

    // Prevent manual activation of trap cards - they must be triggered by game events
    if (card.type === CardType.Trap) {
      this.log(`${card.name} is a trap card and cannot be manually activated!`);
      return false;
    }

    // COST VALIDATION: Check if player can afford to activate the card
    const cardCost = card.cost ?? 0;
    if (player.momentum < cardCost) {
      this.log(
        `Not enough momentum to activate ${card.name}. Need ${cardCost}, have ${player.momentum}.`,
      );
      return false;
    }

    // Also check if this is a reactive trigger (for Support/Action cards used as traps)
    // Allow: ON_PLAY, CONTINUOUS (manually activatable)
    // Block: ON_DEFEND, ON_ATTACK, ON_DESTROY, ON_DRAW (reactive triggers)
    if (card.effectId) {
      const effect = effectsRegistry[card.effectId];
      const reactiveTriggers = [
        "ON_DEFEND",
        "ON_ATTACK",
        "ON_DESTROY",
        "ON_DRAW",
      ];
      if (
        effect &&
        effect.trigger &&
        reactiveTriggers.includes(effect.trigger)
      ) {
        this.log(
          `${card.name} can only be activated when its trigger condition is met (${effect.trigger})`,
        );
        return false;
      }
    }

    // Use metadata system to check activation requirements
    if (card.effectId) {
      const activationCheck = canActivateEffect(
        card.effectId,
        this.state,
        playerIndex,
      );

      if (!activationCheck.canActivate) {
        // Flip face up but effect fails - discard the card
        card.isFaceDown = false;
        card.isActive = false;
        this.log(
          `${card.name} was activated but activation requirements not met - ${
            activationCheck.reason || "effect fails"
          }`,
        );
        moveCard(
          this.state,
          playerIndex,
          Zone.Support0,
          Zone.DiscardPile,
          card.id,
          {
            fromLane: slot,
          },
        );
        this.log(`${card.name} was moved to the discard pile`);
        return true; // Activation succeeded but effect failed
      }
    }

    // COST PAYMENT: Deduct momentum cost BEFORE activating the card
    this.spendMomentum(playerIndex, cardCost);
    if (cardCost > 0) {
      this.log(
        `${player.id} spent ${cardCost} Momentum to activate ${card.name}! (${player.momentum}/10 remaining)`,
      );
    }

    // Flip face up and activate
    card.isFaceDown = false;
    card.isActive = true;

    // Track target for action cards if targeting is required
    if (card.type === CardType.Action && eventData?.targetLane !== undefined) {
      const magicCard = card as ActionCard;
      magicCard.targetPlayerIndex = eventData.targetPlayer ?? playerIndex;
      magicCard.targetLane = eventData.targetLane;

      // Store the target card ID and instance ID
      const targetPlayer = this.state.players[magicCard.targetPlayerIndex];
      const targetCreature = targetPlayer.lanes[magicCard.targetLane];
      if (targetCreature) {
        magicCard.targetCardId = targetCreature.id;
        magicCard.targetCardInstanceId = targetCreature.instanceId;
      }
    }

    this.log(
      `${player.id} flipped ${card.type.toLowerCase()} ${
        card.name
      } face-up and activated it from slot ${slot}`,
    );

    resolveEffectsForCard({
      state: this.state,
      ownerIndex: playerIndex,
      cardEffectId: card.effectId,
      trigger: "ON_PLAY",
      sourceCard: card,
      engine: this,
      eventData,
      onEffectActivated: this.onEffectActivated,
    });

    // Action cards with ONE_TIME effects get discarded after activation
    if (card.type === CardType.Action && getEffectTiming(card) === "ONE_TIME") {
      moveCard(
        this.state,
        playerIndex,
        Zone.Support0,
        Zone.DiscardPile,
        card.id,
        {
          fromLane: slot,
        },
      );
      this.log(
        `${card.name} (Action - One Time) resolved and was moved to the discard pile`,
      );
    }

    // CONTINUOUS action cards stay on field
    // - Persistent effects (no target): Stay until removed by effect
    // - Targeted effects: Stay until target leaves field

    return true;
  }

  /**
   * Activate a trap card during a specific trigger event (e.g., combat, card play, effect activation)
   * This is separate from activateSupport because traps have special timing and trigger-based activation
   *
   * Traps are automatically validated against their trigger type and always discarded after activation.
   */
  activateTrap(
    playerIndex: 0 | 1,
    slot: number,
    eventData?: { lane?: number; targetLane?: number },
  ): boolean {
    const player = this.state.players[playerIndex];
    const card = player.support[slot] as ActionCard | TrapCard | null;

    if (
      !card ||
      (card.type !== CardType.Action && card.type !== CardType.Trap)
    ) {
      return false;
    }

    if (!card.isFaceDown || card.isActive) {
      return false;
    }

    // Verify this card has a trigger-based effect
    if (card.effectId) {
      const effect = effectsRegistry[card.effectId];
      if (!effect || !effect.trigger) {
        this.log(`${card.name} has no trigger effect!`);
        return false;
      }

      // Log the trigger type for clarity
      this.log(
        `⚠️ ${player.id} activates ${effect.trigger} trap: ${card.name}!`,
      );
    }

    // Flip face up and activate
    card.isFaceDown = false;
    card.isActive = true;

    // Resolve the trap effect with the appropriate trigger
    const effect = card.effectId ? effectsRegistry[card.effectId] : null;
    const trigger = effect?.trigger || "ON_DEFEND";

    resolveEffectsForCard({
      state: this.state,
      ownerIndex: playerIndex,
      cardEffectId: card.effectId,
      trigger: trigger as any,
      sourceCard: card,
      engine: this,
      eventData,
      onEffectActivated: this.onEffectActivated,
    });

    // Traps are always discarded after activation
    moveCard(
      this.state,
      playerIndex,
      Zone.Support0,
      Zone.DiscardPile,
      card.id,
      { fromLane: slot },
    );
    this.log(`${card.name} was sent to the discard pile`);

    return true;
  }

  /**
   * Checks all active support cards and removes those whose targets have left the field
   * Called whenever a creature is removed from a lane
   *
   * Public method so effect handlers can call it when they remove creatures
   */
  checkAndRemoveTargetedSupports(
    targetPlayerIndex: 0 | 1,
    targetLane: number,
    removedCardInstanceId?: string,
  ) {
    // Check both players' support zones
    for (let pIndex = 0; pIndex < 2; pIndex++) {
      const player = this.state.players[pIndex];

      for (let slot = 0; slot < player.support.length; slot++) {
        const card = player.support[slot];

        if (
          card &&
          card.type === CardType.Action &&
          card.isActive &&
          !card.isFaceDown
        ) {
          const magicCard = card as ActionCard;

          // Check if this action card was targeting the removed creature
          if (
            magicCard.targetPlayerIndex === targetPlayerIndex &&
            magicCard.targetLane === targetLane &&
            (removedCardInstanceId === undefined ||
              magicCard.targetCardInstanceId === removedCardInstanceId)
          ) {
            // Target has left the field - discard this action card
            moveCard(
              this.state,
              pIndex as 0 | 1,
              Zone.Support0,
              Zone.DiscardPile,
              magicCard.id,
              {
                fromLane: slot,
              },
            );
            this.log(
              `${magicCard.name} was discarded because its target left the field`,
            );
            // Also remove any active effects that were provided by this action card
            const effectsToRemove = this.state.activeEffects.filter(
              (e) => e.sourceCardId === magicCard.id,
            );
            effectsToRemove.forEach((e) => {
              this.removeActiveEffect(e.id);
              this.log(
                `Removed persistent effect ${e.name} from ${magicCard.name}`,
              );
            });
          }
        }
      }
    }
  }

  toggleCreatureMode(playerIndex: 0 | 1, lane: number): boolean {
    if (this.state.winnerIndex !== null) return false;

    // Must be in main phase
    if (this.state.phase !== "MAIN") {
      this.log("Cannot change modes during draw phase. Draw a card first!");
      return false;
    }

    const player = this.state.players[playerIndex];
    const creature = player.lanes[lane];

    if (!creature || creature.type !== CardType.Creature) return false;

    // Face-down creatures cannot toggle modes - they must be flipped face-up first
    if (creature.isFaceDown) {
      this.log(
        `${creature.name} must be flipped face-up before changing modes!`,
      );
      return false;
    }

    // Check if creature has already changed mode this turn
    if (creature.hasChangedModeThisTurn) {
      this.log(`${creature.name} has already changed mode this turn!`);
      return false;
    }

    // Check if creature has already attacked this turn
    if (creature.hasAttackedThisTurn) {
      this.log(`${creature.name} cannot change modes after attacking!`);
      return false;
    }

    // Toggle mode
    const newMode = creature.mode === "ATTACK" ? "DEFENSE" : "ATTACK";
    creature.mode = newMode;
    creature.hasChangedModeThisTurn = true;

    this.log(`${creature.name} switched to ${newMode} mode`);
    return true;
  }

  flipCreatureFaceUp(playerIndex: 0 | 1, lane: number): boolean {
    if (this.state.winnerIndex !== null) return false;

    const player = this.state.players[playerIndex];
    const creature = player.lanes[lane];

    if (!creature || creature.type !== CardType.Creature) return false;
    if (!creature.isFaceDown) return false;

    creature.isFaceDown = false;
    // When flipped face-up, automatically switch to ATTACK mode
    creature.mode = "ATTACK";
    this.log(`${creature.name} was flipped face-up in ATTACK mode!`);

    // Apply any persistent active effects when a creature is revealed
    this.applyActiveEffectsToCreature(playerIndex, creature);

    // Trigger summon effects when flipped face-up
    resolveEffectsForCard({
      state: this.state,
      ownerIndex: playerIndex,
      cardEffectId: creature.effectId,
      trigger: "ON_PLAY",
      sourceCard: creature,
      engine: this,
      onEffectActivated: this.onEffectActivated,
    });

    return true;
  }

  // Attack helper — supports two call styles:
  // - attack(attackerLane, targetLane?) uses the active player as attacker
  // - attack(playerIndex, attackerLane, targetLane)
  attack(
    playerIndexOrAttackerLane: number,
    attackerLaneOrTarget?: number,
    targetLaneMaybe?: number,
  ) {
    if (this.state.winnerIndex !== null) return;

    let playerIndex: 0 | 1;
    let attackerLane: number;
    let targetLane: number;

    if (typeof targetLaneMaybe === "number") {
      // Called as (playerIndex, attackerLane, targetLane)
      playerIndex = playerIndexOrAttackerLane as 0 | 1;
      attackerLane = attackerLaneOrTarget!;
      targetLane = targetLaneMaybe;
    } else {
      // Called as (attackerLane, targetLane?) — use active player
      playerIndex = this.state.activePlayer as 0 | 1;
      attackerLane = playerIndexOrAttackerLane;
      targetLane =
        typeof attackerLaneOrTarget === "number" ? attackerLaneOrTarget : 0;
    }

    // Must be in main phase to attack
    if (this.state.phase !== "MAIN") {
      this.log("Cannot attack during draw phase. Draw a card first!");
      return;
    }

    // First turn (turn 1) - player going first cannot attack
    if (this.state.turn === 1 && playerIndex === 0) {
      this.log("Cannot attack on the first turn of the game!");
      return;
    }

    const attacker = this.state.players[playerIndex].lanes[attackerLane];
    if (!attacker) return;

    // Cannot attack if creature is face-down
    if (attacker.isFaceDown) {
      this.log(`${attacker.name} cannot attack while face-down!`);
      return;
    }

    // Cannot attack if creature is in defense mode
    if (attacker.mode === "DEFENSE") {
      this.log(
        `${attacker.name} cannot attack while in defense mode! Switch to attack mode first.`,
      );
      return;
    }

    // Check if creature has already attacked this turn
    if (attacker.hasAttackedThisTurn) {
      this.log(`${attacker.name} has already attacked this turn!`);
      return;
    }

    // Mark creature as having attacked
    attacker.hasAttackedThisTurn = true;

    // Momentum: Gain +2 for declaring attack (initiative bonus)
    this.gainMomentum(playerIndex, 2);

    resolveEffectsForCard({
      state: this.state,
      ownerIndex: playerIndex,
      cardEffectId: attacker.onAttackEffectId,
      trigger: "ON_ATTACK",
      sourceCard: attacker,
      engine: this,
      onEffectActivated: this.onEffectActivated,
    });

    const opponentIndex = getOpponentIndex(playerIndex);
    const opponent = this.state.players[opponentIndex];
    const defender = opponent.lanes[targetLane];

    if (!defender) {
      // Check if opponent has ANY creatures on the field
      const hasAnyCreatures = opponent.lanes.some(
        (creature) => creature !== null,
      );

      if (!hasAnyCreatures) {
        // Opponent has no creatures - direct attack deals damage to life points
        const effectiveAtk = this.getEffectiveAtk(attacker, playerIndex);
        const damage = effectiveAtk;
        opponent.lifePoints -= damage;

        this.log(`${attacker.name} attacked ${opponent.id} directly!`);
        this.log(
          `${opponent.id} has no creatures to defend! Direct attack deals ${damage} damage!`,
        );
        this.log(
          `${opponent.id} Life Points: ${opponent.lifePoints < 0 ? 0 : opponent.lifePoints}/2000`,
        );

        // Check for victory by reducing life points to 0
        if (opponent.lifePoints <= 0 && this.state.winnerIndex === null) {
          this.state.winnerIndex = playerIndex;
          this.log(
            `Player ${playerIndex + 1} wins! ${
              opponent.id
            }'s Life Points reached 0!`,
          );
        }
      } else {
        // Opponent has creatures, but this lane is empty - no effect
        this.log(
          `${attacker.name} attacked lane ${targetLane} but no creature was there.`,
        );
      }
      return;
    }

    // Flip defender face-up if they're face-down (revealed by attack)
    if (defender.isFaceDown) {
      defender.isFaceDown = false;
      this.log(`${defender.name} was flipped face-up by the attack!`);
    }

    // lane combat with HP system based on modes
    // ATTACK MODE vs ATTACK MODE: Attacker deals full ATK, defender counters with (ATK - attacker's ATK)
    // ATTACK MODE vs DEFENSE MODE: ATK - DEF damage, but NO counter-attack (safe defense)

    if (attacker.mode === "ATTACK" && defender.mode === "ATTACK") {
      // Both in attack mode - attacker gets advantage
      // Attacker deals full damage, defender only counters with the difference
      const attackerEffectiveAtk = this.getEffectiveAtk(attacker, playerIndex);
      const defenderEffectiveAtk = this.getEffectiveAtk(
        defender,
        opponentIndex,
      );

      const damageToDefender = attackerEffectiveAtk;
      const damageToAttacker = Math.max(
        0,
        defenderEffectiveAtk - attackerEffectiveAtk,
      );

      this.log(
        `⚔️ CLASH! ${attacker.name} (ATK: ${attackerEffectiveAtk}) vs ${defender.name} (ATK: ${defenderEffectiveAtk})`,
      );

      // Attacker deals full damage
      defender.currentHp -= damageToDefender;
      this.log(
        `  → ${attacker.name} strikes first! ${defender.name} takes ${damageToDefender} damage! HP: ${defender.currentHp}/${defender.hp}`,
      );

      // Defender counters only if they have higher ATK
      if (damageToAttacker > 0) {
        attacker.currentHp -= damageToAttacker;
        this.log(
          `  → ${defender.name} counters for ${damageToAttacker} damage! ${attacker.name} HP: ${attacker.currentHp}/${attacker.hp}`,
        );
      }

      // Check if defender is defeated
      if (defender.currentHp <= 0) {
        // Calculate piercing damage (excess damage to life points)
        const piercingDamage = Math.abs(defender.currentHp);

        opponent.lanes[targetLane] = null;
        // MAX cards are removed from game, not discarded
        if (defender.isMax) {
          opponent.removedFromGame = [...opponent.removedFromGame, defender];
          this.log(
            `💀 ${defender.name} was destroyed and removed from the game! (MAX card)`,
          );
        } else {
          opponent.discardPile = [
            ...opponent.discardPile,
            this.normalizeCardForDiscard(defender),
          ];
          this.log(`💀 ${defender.name} was destroyed!`);
        }

        // Apply piercing damage to opponent's life points
        if (piercingDamage > 0) {
          opponent.lifePoints -= piercingDamage;
          this.log(
            `⚡ PIERCING DAMAGE! ${piercingDamage} excess damage dealt to ${opponent.id}'s Life Points!`,
          );
          this.log(`${opponent.id} Life Points: ${opponent.lifePoints}/200`);

          // Check for victory by reducing life points to 0
          if (opponent.lifePoints <= 0 && this.state.winnerIndex === null) {
            this.state.winnerIndex = playerIndex;
            this.log(
              `🏆 VICTORY! ${this.state.players[playerIndex].id} wins! ${opponent.id}'s Life Points reached 0!`,
            );
          }
        }

        // Remove any support cards targeting this creature
        this.checkAndRemoveTargetedSupports(
          opponentIndex,
          targetLane,
          defender.instanceId,
        );
        // Momentum: +2 for KO
        this.gainMomentum(playerIndex, 2);
      }

      // Check if attacker is defeated (only if defender had higher ATK)
      if (attacker.currentHp <= 0) {
        this.state.players[playerIndex].lanes[attackerLane] = null;
        // MAX cards are removed from game, not discarded
        if (attacker.isMax) {
          this.state.players[playerIndex].removedFromGame = [
            ...this.state.players[playerIndex].removedFromGame,
            attacker,
          ];
          this.log(
            `💀 ${attacker.name} was destroyed by the counter-attack and removed from the game! (MAX card)`,
          );
        } else {
          this.state.players[playerIndex].discardPile = [
            ...this.state.players[playerIndex].discardPile,
            this.normalizeCardForDiscard(attacker),
          ];
          this.log(`💀 ${attacker.name} was destroyed by the counter-attack!`);
        }
        // Remove any support cards targeting this creature
        this.checkAndRemoveTargetedSupports(
          playerIndex,
          attackerLane,
          attacker.instanceId,
        );
        // Momentum: +2 for KO (defender's controller gets it)
        this.gainMomentum(opponentIndex, 2);
      } else if (attacker.currentHp > 0 && defender.currentHp > 0) {
        // Both survived combat - defender gets +1 Momentum for surviving attack
        this.gainMomentum(opponentIndex, 1);
      }
    } else if (attacker.mode === "ATTACK" && defender.mode === "DEFENSE") {
      // Defender in defense mode - reduces damage and NO counter-attack
      const attackerEffectiveAtk = this.getEffectiveAtk(attacker, playerIndex);
      const defenderEffectiveDef = this.getEffectiveDef(
        defender,
        opponentIndex,
      );

      const rawDamage = attackerEffectiveAtk;
      const blockedDamage = defenderEffectiveDef;
      const damageToDefender = Math.max(0, rawDamage - blockedDamage);

      this.log(
        `🛡️ DEFENSE! ${attacker.name} (ATK: ${attackerEffectiveAtk}) attacks ${defender.name} (DEF: ${defenderEffectiveDef})`,
      );

      if (damageToDefender > 0) {
        defender.currentHp -= damageToDefender;
        this.log(
          `  → ${defender.name} blocked ${blockedDamage} damage, took ${damageToDefender} damage! HP: ${defender.currentHp}/${defender.hp}`,
        );

        // Check if defender is defeated
        if (defender.currentHp <= 0) {
          opponent.lanes[targetLane] = null;
          // MAX cards are removed from game, not discarded
          if (defender.isMax) {
            opponent.removedFromGame = [...opponent.removedFromGame, defender];
            this.log(
              `💀 ${defender.name} was destroyed and removed from the game! (MAX card)`,
            );
          } else {
            opponent.discardPile = [
              ...opponent.discardPile,
              this.normalizeCardForDiscard(defender),
            ];
            this.log(`💀 ${defender.name} was destroyed!`);
          }
          // Remove any support cards targeting this creature
          this.checkAndRemoveTargetedSupports(
            opponentIndex,
            targetLane,
            defender.instanceId,
          );
          // Momentum: +2 for KO
          this.gainMomentum(playerIndex, 2);
        }
        // No momentum awarded to defender in defense mode - trade-off for safety
      } else {
        // Attacker failed to penetrate defense - NO DAMAGE AT ALL
        this.log(
          `  → ${defender.name}'s defense completely blocked the attack! (blocked ${blockedDamage} damage)`,
        );
        this.log(
          `  → ${attacker.name} dealt no damage and took no counter-damage!`,
        );
        // No momentum awarded to defender in defense mode - trade-off for safety
      }

      // Key advantage: Attacker takes NO damage when attacking defense mode
      // Attacker always survives (no counter-attack damage)
      this.log(
        `  → ${attacker.name} is safe from counter-attacks! HP: ${attacker.currentHp}/${attacker.hp}`,
      );
    }
  }

  endTurn() {
    if (this.state.winnerIndex !== null) return; // game finished

    // Log turn ending before switching players
    const currentPlayer = this.state.players[this.state.activePlayer];
    this.logger.turnEnd(
      this.state.turn,
      this.state.activePlayer,
      currentPlayer.id,
    );

    // Reset hasAttackedThisTurn, hasChangedModeThisTurn, and hasActivatedEffectThisTurn for all creatures on the current player's field
    currentPlayer.lanes.forEach((creature) => {
      if (creature && creature.type === CardType.Creature) {
        creature.hasAttackedThisTurn = false;
        creature.hasChangedModeThisTurn = false;
        creature.hasActivatedEffectThisTurn = false;
      }
    });

    // Update active effects durations
    this.updateActiveEffects();

    this.state.activePlayer = getOpponentIndex(this.state.activePlayer);
    this.state.turn++;
    this.state.phase = "DRAW";
    this.state.hasDrawnThisTurn = false;

    const newActivePlayer = this.state.players[this.state.activePlayer];
    this.logger.turnStart(
      this.state.turn,
      this.state.activePlayer,
      newActivePlayer.id,
    );
    this.logger.phaseChange(
      this.state.turn,
      "DRAW",
      "Draw Phase - Draw a card to begin",
    );
  }

  addActiveEffect(
    effectId: string,
    name: string,
    sourceCard: CardInterface,
    playerIndex: 0 | 1,
    turns?: number,
    description?: string,
    affectedCardIds?: string[],
    statModifiers?: { atk?: number; def?: number },
    isGlobal?: boolean,
  ) {
    const effect: ActiveEffect = {
      id: effectId,
      name,
      sourceCardId: sourceCard.id,
      sourceCardName: sourceCard.name,
      playerIndex,
      turnsRemaining: turns,
      description: description || name,
      affectedCardIds: affectedCardIds ? Array.from(affectedCardIds) : [], // Ensure truly mutable array
      statModifiers,
      isGlobal,
      effectDefinitionId: sourceCard.effectId, // Store for global effects
      scope: playerIndex === 0 ? "player1" : "player2", // Default scope to owner player
    };

    this.state.activeEffects.push(effect);
    this.log(`Effect activated: ${name} from ${sourceCard.name}`);
    // Immediately apply this persistent effect to any existing matching creatures
    this.applyActiveEffectToAll(effect);
  }

  removeActiveEffect(effectId: string) {
    const index = this.state.activeEffects.findIndex((e) => e.id === effectId);
    if (index >= 0) {
      const effect = this.state.activeEffects[index];

      // Revert stat modifiers and keywords on affected cards
      if (effect.affectedCardIds && effect.affectedCardIds.length > 0) {
        const def = effectsRegistry[effect.id];
        effect.affectedCardIds.forEach((cardId) => {
          [0, 1].forEach((pIdx) => {
            const player = this.state.players[pIdx];
            player.lanes.forEach((creature) => {
              if (creature && creature.id === cardId) {
                // revert stat modifiers
                if (effect.statModifiers && effect.statModifiers.atk)
                  (creature as any).atk -= effect.statModifiers.atk;
                if (effect.statModifiers && effect.statModifiers.def)
                  (creature as any).def -= effect.statModifiers.def;

                // revert keywords based on effect definition
                if (def && def.actions) {
                  def.actions.forEach((action: any) => {
                    if (action.type === "KEYWORD" && action.mode === "ADD") {
                      (action.keywords || []).forEach((kw: string) => {
                        const idx = (creature as any).keywords.indexOf(kw);
                        if (idx >= 0) (creature as any).keywords.splice(idx, 1);
                      });
                    }
                  });
                }
              }
            });
          });
        });
      }

      this.state.activeEffects.splice(index, 1);
      this.log(`Effect expired: ${effect.name}`);
    }
  }

  private applyActiveEffectToAll(effect: ActiveEffect) {
    const def = effectsRegistry[effect.id];
    if (!def || !def.actions) return;

    // For now, only handle STAT_MOD and KEYWORD actions that target ALLY_CREATURE
    def.actions.forEach((action: any) => {
      if (action.type === "STAT_MOD" || action.type === "KEYWORD") {
        // Determine which player's creatures to consider
        const pIdx = effect.playerIndex;
        const player = this.state.players[pIdx];

        player.lanes.forEach((creature, laneIndex) => {
          if (!creature) return;

          // Apply filter if present
          if (action.filter && action.filter.affinity) {
            if ((creature as any).affinity !== action.filter.affinity) return;
          }

          // Skip if already recorded
          if (
            effect.affectedCardIds &&
            effect.affectedCardIds.includes(creature.instanceId)
          )
            return;

          try {
            // Apply stat modifier
            if (action.type === "STAT_MOD" && action.atk) {
              (creature as any).atk += action.atk;
              if (!effect.affectedCardIds) {
                effect.affectedCardIds = [];
              }
              if (!effect.affectedCardIds.includes(creature.instanceId)) {
                effect.affectedCardIds.push(creature.instanceId);
              }
            }

            // Apply keyword add
            if (action.type === "KEYWORD" && action.keywords) {
              action.keywords.forEach((kw: string) => {
                if (!(creature as any).keywords.includes(kw)) {
                  (creature as any).keywords.push(kw);
                }
              });
              if (!effect.affectedCardIds) {
                effect.affectedCardIds = [];
              }
              if (!effect.affectedCardIds.includes(creature.instanceId)) {
                effect.affectedCardIds.push(creature.instanceId);
              }
            }
          } catch (err) {
            this.log(
              `Error applying effect to ${creature.name} in lane ${laneIndex}: ${err}`,
            );
          }
        });
      }
    });
  }

  /**
   * Get face-down trap/support cards that can be activated for a specific trigger
   * Returns an array of {card, slot} objects
   *
   * @param playerIndex - Player whose traps to check
   * @param trigger - The trigger type to filter by (e.g., "ON_DEFEND", "ON_ATTACK", "ON_PLAY")
   */
  getActivatableTraps(
    playerIndex: 0 | 1,
    trigger?: string,
  ): Array<{ card: ActionCard | TrapCard; slot: number }> {
    const player = this.state.players[playerIndex];
    const traps: Array<{
      card: ActionCard | TrapCard;
      slot: number;
    }> = [];

    player.support.forEach((card, slot) => {
      if (card && card.isFaceDown && !card.isActive && card.effectId) {
        const effect = effectsRegistry[card.effectId];
        // If no trigger specified, return all trap cards
        // If trigger specified, only return cards matching that trigger
        if (effect && (!trigger || effect.trigger === trigger)) {
          traps.push({
            card: card as ActionCard | TrapCard,
            slot,
          });
        }
      }
    });

    return traps;
  }

  private applyActiveEffectsToCreature(
    playerIndex: 0 | 1,
    creature: CreatureCard,
  ) {
    // Iterate all active effects and apply ones that match this creature
    this.state.activeEffects.forEach((effect) => {
      // For global effects, use the stored effectDefinitionId
      if (effect.isGlobal && effect.effectDefinitionId) {
        const def = effectsRegistry[effect.effectDefinitionId];
        if (!def || !def.actions) return;

        def.actions.forEach((action: any) => {
          if (action.target !== "ALLY_CREATURE") return;
          // effect must belong to the same player to be an ally buff
          if (effect.playerIndex !== playerIndex) return;

          // affinity filter
          if (action.filter && action.filter.affinity) {
            if ((creature as any).affinity !== action.filter.affinity) return;
          }

          // Skip if already affected
          if (
            effect.affectedCardIds &&
            effect.affectedCardIds.includes(creature.instanceId)
          )
            return;

          // Apply stat mod
          if (action.type === "STAT_MOD" && action.atk) {
            (creature as any).atk += action.atk;
          }
          if (action.type === "STAT_MOD" && action.def) {
            (creature as any).def += action.def;
          }

          // Apply keywords
          if (action.type === "KEYWORD" && action.mode === "ADD") {
            (action.keywords || []).forEach((kw: string) => {
              if (!(creature as any).keywords) (creature as any).keywords = [];
              if (!(creature as any).keywords.includes(kw)) {
                (creature as any).keywords.push(kw);
              }
            });
          }

          // Track that this creature is now affected
          if (!effect.affectedCardIds) {
            effect.affectedCardIds = [creature.instanceId];
          } else if (!effect.affectedCardIds.includes(creature.instanceId)) {
            effect.affectedCardIds = [
              ...effect.affectedCardIds,
              creature.instanceId,
            ];
          }
        });
        return; // Skip the source card lookup for global effects
      }

      // For non-global effects, find the source card to get its effectId
      let sourceCard: CardInterface | null = null;
      const player = this.state.players[effect.playerIndex];

      // Search for source card in support slots
      for (const card of player.support) {
        if (card && card.id === effect.sourceCardId) {
          sourceCard = card;
          break;
        }
      }

      // If not found in support, try lanes
      if (!sourceCard) {
        for (const card of player.lanes) {
          if (card && card.id === effect.sourceCardId) {
            sourceCard = card;
            break;
          }
        }
      }

      if (!sourceCard || !sourceCard.effectId) return;

      // If the source card is a targeted action card, skip auto-applying to new creatures
      // Targeted action cards should only affect their original target
      if (sourceCard.type === CardType.Action) {
        const magicCard = sourceCard as any;
        if (magicCard.targetCardId) {
          // This is a targeted action card - don't apply to other creatures
          return;
        }
      }

      // Look up the effect definition using the source card's effectId
      const def = effectsRegistry[sourceCard.effectId];
      if (!def || !def.actions) return;

      def.actions.forEach((action: any) => {
        if (action.target !== "ALLY_CREATURE") return;
        // effect must belong to the same player to be an ally buff
        if (effect.playerIndex !== playerIndex) return;

        // affinity filter
        if (action.filter && action.filter.affinity) {
          if ((creature as any).affinity !== action.filter.affinity) return;
        }

        // Skip if already affected
        if (
          effect.affectedCardIds &&
          effect.affectedCardIds.includes(creature.id)
        )
          return;

        // Apply stat mod
        if (action.type === "STAT_MOD" && action.atk) {
          (creature as any).atk += action.atk;
          effect.affectedCardIds = effect.affectedCardIds || [];
          effect.affectedCardIds.push(creature.id);
        }

        // Apply keyword
        if (action.type === "KEYWORD" && action.keywords) {
          action.keywords.forEach((kw: string) => {
            if (!(creature as any).keywords.includes(kw))
              (creature as any).keywords.push(kw);
          });
          effect.affectedCardIds = effect.affectedCardIds || [];
          if (!effect.affectedCardIds.includes(creature.id))
            effect.affectedCardIds.push(creature.id);
        }
      });
    });
  }

  private updateActiveEffects() {
    const expiredEffects: string[] = [];

    this.state.activeEffects.forEach((effect) => {
      if (effect.turnsRemaining !== undefined) {
        effect.turnsRemaining--;
        if (effect.turnsRemaining <= 0) {
          expiredEffects.push(effect.id);
        }
      }
    });

    expiredEffects.forEach((id) => this.removeActiveEffect(id));
  }

  /**
   * VALIDATION HELPERS FOR UI PRE-CHECKS
   * These methods validate commands without mutating state
   */

  /**
   * Check if a player can afford to play a specific card
   * Returns validation result with structured error if invalid
   */
  canAffordCard(playerIndex: 0 | 1, cardId: string): CommandResult {
    const player = this.state.players[playerIndex];

    // Find card in hand or maxDeck
    let card = player.hand.find((c) => c.id === cardId);
    if (!card) {
      card = player.maxDeck.find((c) => c.id === cardId);
    }

    if (!card) {
      return createError(
        CommandErrorCode.CARD_NOT_IN_HAND,
        `Card ${cardId} not found in hand or MAX deck.`,
        { cardId },
      );
    }

    const cardCost = card.cost ?? 0;
    const validation = validateMomentumCost(
      player.momentum,
      cardCost,
      card.name,
      card.id,
    );

    if (!validation.valid && validation.error) {
      return {
        success: false,
        error: validation.error,
      };
    }

    return createSuccess();
  }

  /**
   * Get all cards in hand that the player can currently afford
   */
  getAffordableCards(playerIndex: 0 | 1): CardInterface[] {
    const player = this.state.players[playerIndex];
    return player.hand.filter((card) => {
      const cardCost = card.cost ?? 0;
      return player.momentum >= cardCost;
    });
  }

  /**
   * Check if any card in hand is affordable
   */
  hasAffordableCard(playerIndex: 0 | 1): boolean {
    return this.getAffordableCards(playerIndex).length > 0;
  }
}
