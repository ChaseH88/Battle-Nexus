import { GameState, getOpponentIndex, ActiveEffect } from "./GameState";
import { CardInterface, CardType, CreatureCard } from "../cards";
import { SupportCard } from "../cards/SupportCard";
import { ActionCard } from "../cards/ActionCard";
import { moveCard } from "./ZoneEngine";
import { Zone } from "./zones";
import { resolveEffectsForCard } from "../effects/resolve";
import { effectsRegistry } from "../effects/registry";
import { canActivateEffect } from "../effects/metadata";

export class BattleEngine {
  constructor(public state: GameState) {}

  // Legacy log method for simple strings (maintains compatibility)
  log(msg: string) {
    this.state.log.info(this.state.turn, this.state.phase, msg);
  }

  // Access to the full logger for structured events
  get logger() {
    return this.state.log;
  }

  private registerKO(attackerIndex: 0 | 1, defeated: CreatureCard) {
    this.state.koCount[attackerIndex] += 1;
    const ko = this.state.koCount[attackerIndex];
    this.log(
      `Creature KO: ${defeated.name} was destroyed. Player ${
        attackerIndex + 1
      } now has ${ko} KOs.`
    );

    if (ko >= 3 && this.state.winnerIndex === null) {
      this.state.winnerIndex = attackerIndex;
      this.log(`Player ${attackerIndex + 1} wins by reaching 3 KOs!`);
    }
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
      this.state // Pass state for snapshot
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
        this.state // Pass state for snapshot
      );
    }

    resolveEffectsForCard({
      state: this.state,
      ownerIndex: playerIndex as 0 | 1,
      trigger: "ON_DRAW",
      cardEffectId: topCard.effectId,
    });
  }

  playCreature(
    playerIndex: number,
    lane: number,
    cardId: string,
    faceDown: boolean = false,
    mode: "ATTACK" | "DEFENSE" = "ATTACK"
  ): boolean {
    // Must be in main phase to play cards
    if (this.state.phase !== "MAIN") {
      this.log("Cannot play cards during draw phase. Draw a card first!");
      return false;
    }

    const player = this.state.players[playerIndex];
    const card = player.hand.find((c) => c.id === cardId);
    if (!card || card.type !== CardType.Creature) return false;
    if (player.lanes[lane] !== null) return false;

    moveCard(this.state, playerIndex, Zone.Hand, Zone.Lane0, cardId, {
      toLane: lane,
    });

    const creature = player.lanes[lane]!;
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
      this.state // Pass state for snapshot
    );

    // Apply any persistent active effects (supports/global buffs) to this creature
    this.applyActiveEffectsToCreature(playerIndex as 0 | 1, creature);

    // Only trigger effects if played face-up
    if (!faceDown) {
      resolveEffectsForCard({
        state: this.state,
        ownerIndex: playerIndex as 0 | 1,
        cardEffectId: card.effectId,
        trigger: "ON_PLAY",
        sourceCard: card,
        engine: this,
      });
    }

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
    if (
      !card ||
      (card.type !== CardType.Support && card.type !== CardType.Action)
    )
      return false;

    moveCard(this.state, playerIndex, Zone.Hand, Zone.Support0, cardId, {
      toLane: slot,
    });

    const spellCard = player.support[slot]! as SupportCard | ActionCard;

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
      this.state
    );

    this.log(
      `${
        player.id
      } set ${card.type.toLowerCase()} card face-down to support slot ${slot}`
    );

    return true;
  }

  activateSupport(
    playerIndex: 0 | 1,
    slot: number,
    eventData?: { lane?: number; targetLane?: number; targetPlayer?: 0 | 1 }
  ): boolean {
    if (this.state.winnerIndex !== null) return false;

    // Must be in main phase
    if (this.state.phase !== "MAIN") {
      this.log("Cannot activate cards during draw phase. Draw a card first!");
      return false;
    }

    const player = this.state.players[playerIndex];
    const card = player.support[slot] as SupportCard | ActionCard | null;

    if (
      !card ||
      (card.type !== CardType.Support && card.type !== CardType.Action)
    )
      return false;

    if (card.isActive) {
      this.log(`${card.name} is already active!`);
      return false;
    }

    // Use metadata system to check activation requirements
    if (card.effectId) {
      const activationCheck = canActivateEffect(
        card.effectId,
        this.state,
        playerIndex
      );

      if (!activationCheck.canActivate) {
        // Flip face up but effect fails - discard the card
        card.isFaceDown = false;
        card.isActive = false;
        this.log(
          `${card.name} was activated but activation requirements not met - ${
            activationCheck.reason || "effect fails"
          }`
        );
        moveCard(
          this.state,
          playerIndex,
          Zone.Support0,
          Zone.DiscardPile,
          card.id,
          {
            fromLane: slot,
          }
        );
        this.log(`${card.name} was moved to the discard pile`);
        return true; // Activation succeeded but effect failed
      }
    }

    // Flip face up and activate
    card.isFaceDown = false;
    card.isActive = true;

    this.log(
      `${player.id} flipped ${card.type.toLowerCase()} ${
        card.name
      } face-up and activated it from slot ${slot}`
    );

    resolveEffectsForCard({
      state: this.state,
      ownerIndex: playerIndex,
      cardEffectId: card.effectId,
      trigger: "ON_PLAY",
      sourceCard: card,
      engine: this,
      eventData,
    });

    // Discard ONE_TIME effect cards (both Action and Support) after activation
    // CONTINUOUS effects remain on the field
    if (card.effectType === "ONE_TIME") {
      moveCard(
        this.state,
        playerIndex,
        Zone.Support0,
        Zone.DiscardPile,
        card.id,
        {
          fromLane: slot,
        }
      );
      this.log(`${card.name} resolved and was moved to the discard pile`);
    }

    return true;
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

    // Check if creature has already changed mode this turn
    if (creature.hasChangedModeThisTurn) {
      this.log(`${creature.name} has already changed mode this turn!`);
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
    this.log(`${creature.name} was flipped face-up!`);

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
    });

    return true;
  }

  // Attack helper — supports two call styles:
  // - attack(attackerLane, targetLane?) uses the active player as attacker
  // - attack(playerIndex, attackerLane, targetLane)
  attack(
    playerIndexOrAttackerLane: number,
    attackerLaneOrTarget?: number,
    targetLaneMaybe?: number
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
        `${attacker.name} cannot attack while in defense mode! Switch to attack mode first.`
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

    resolveEffectsForCard({
      state: this.state,
      ownerIndex: playerIndex,
      cardEffectId: attacker.onAttackEffectId,
      trigger: "ON_ATTACK",
    });

    const opponentIndex = getOpponentIndex(playerIndex);
    const opponent = this.state.players[opponentIndex];
    const defender = opponent.lanes[targetLane];

    if (!defender) {
      // Check if opponent has ANY creatures on the field
      const hasAnyCreatures = opponent.lanes.some(
        (creature) => creature !== null
      );

      if (!hasAnyCreatures) {
        // Opponent has no creatures - direct attack scores a KO point
        this.log(`${attacker.name} attacked ${opponent.id} directly!`);
        this.log(
          `${opponent.id} has no creatures to defend! Direct attack scores a KO point!`
        );

        // Award KO point for undefended direct attack
        this.state.koCount[playerIndex] += 1;
        const ko = this.state.koCount[playerIndex];
        this.log(
          `Player ${playerIndex + 1} scores a KO point! Total: ${ko} KOs.`
        );

        if (ko >= 3 && this.state.winnerIndex === null) {
          this.state.winnerIndex = playerIndex;
          this.log(`Player ${playerIndex + 1} wins by reaching 3 KOs!`);
        }
      } else {
        // Opponent has creatures, but this lane is empty - no effect
        this.log(
          `${attacker.name} attacked lane ${targetLane} but no creature was there.`
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
      const damageToDefender = attacker.atk;
      const damageToAttacker = Math.max(0, defender.atk - attacker.atk);

      this.log(
        `⚔️ CLASH! ${attacker.name} (ATK: ${attacker.atk}) vs ${defender.name} (ATK: ${defender.atk})`
      );

      // Attacker deals full damage
      defender.currentHp -= damageToDefender;
      this.log(
        `  → ${attacker.name} strikes first! ${defender.name} takes ${damageToDefender} damage! HP: ${defender.currentHp}/${defender.hp}`
      );

      // Defender counters only if they have higher ATK
      if (damageToAttacker > 0) {
        attacker.currentHp -= damageToAttacker;
        this.log(
          `  → ${defender.name} counters for ${damageToAttacker} damage! ${attacker.name} HP: ${attacker.currentHp}/${attacker.hp}`
        );
      } else {
        this.log(
          `  → ${defender.name} couldn't counter effectively! ${attacker.name} HP: ${attacker.currentHp}/${attacker.hp}`
        );
      }

      // Check if defender is defeated
      if (defender.currentHp <= 0) {
        opponent.lanes[targetLane] = null;
        opponent.discardPile.push(defender);
        this.log(`💀 ${defender.name} was destroyed!`);
        this.registerKO(playerIndex, defender);
      }

      // Check if attacker is defeated (only if defender had higher ATK)
      if (attacker.currentHp <= 0) {
        this.state.players[playerIndex].lanes[attackerLane] = null;
        this.state.players[playerIndex].discardPile.push(attacker);
        this.log(`💀 ${attacker.name} was destroyed by the counter-attack!`);
        this.registerKO(opponentIndex, attacker);
      }
    } else if (attacker.mode === "ATTACK" && defender.mode === "DEFENSE") {
      // Defender in defense mode - reduces damage and NO counter-attack
      const rawDamage = attacker.atk;
      const blockedDamage = defender.def;
      const damageToDefender = Math.max(0, rawDamage - blockedDamage);

      this.log(
        `🛡️ DEFENSE! ${attacker.name} (ATK: ${attacker.atk}) attacks ${defender.name} (DEF: ${defender.def})`
      );

      if (damageToDefender > 0) {
        defender.currentHp -= damageToDefender;
        this.log(
          `  → ${defender.name} blocked ${blockedDamage} damage, took ${damageToDefender} damage! HP: ${defender.currentHp}/${defender.hp}`
        );

        // Check if defender is defeated
        if (defender.currentHp <= 0) {
          opponent.lanes[targetLane] = null;
          opponent.discardPile.push(defender);
          this.log(`💀 ${defender.name} was destroyed!`);
          this.registerKO(playerIndex, defender);
        }
      } else {
        // Attacker failed to penetrate defense - NO DAMAGE AT ALL
        this.log(
          `  → ${defender.name}'s defense completely blocked the attack! (blocked ${blockedDamage} damage)`
        );
        this.log(
          `  → ${attacker.name} dealt no damage and took no counter-damage!`
        );
      }

      // Key advantage: Attacker takes NO damage when attacking defense mode
      this.log(
        `  → ${attacker.name} is safe from counter-attacks! HP: ${attacker.currentHp}/${attacker.hp}`
      );
    }
  }

  endTurn() {
    if (this.state.winnerIndex !== null) return; // game finished

    // Reset hasAttackedThisTurn and hasChangedModeThisTurn for all creatures on the current player's field
    const currentPlayer = this.state.players[this.state.activePlayer];
    currentPlayer.lanes.forEach((creature) => {
      if (creature && creature.type === CardType.Creature) {
        creature.hasAttackedThisTurn = false;
        creature.hasChangedModeThisTurn = false;
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
      newActivePlayer.id
    );
    this.logger.phaseChange(
      this.state.turn,
      "DRAW",
      "Draw Phase - Draw a card to begin"
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
    statModifiers?: { atk?: number; def?: number }
  ) {
    const effect: ActiveEffect = {
      id: effectId,
      name,
      sourceCardId: sourceCard.id,
      sourceCardName: sourceCard.name,
      playerIndex,
      turnsRemaining: turns,
      description: description || name,
      affectedCardIds,
      statModifiers,
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

        player.lanes.forEach((creature) => {
          if (!creature) return;

          // Apply filter if present
          if (action.filter && action.filter.affinity) {
            if ((creature as any).affinity !== action.filter.affinity) return;
          }

          // Skip if already recorded
          if (
            effect.affectedCardIds &&
            effect.affectedCardIds.includes(creature.id)
          )
            return;

          // Apply stat modifier
          if (action.type === "STAT_MOD" && action.atk) {
            (creature as any).atk += action.atk;
            effect.affectedCardIds = effect.affectedCardIds || [];
            effect.affectedCardIds.push(creature.id);
          }

          // Apply keyword add
          if (action.type === "KEYWORD" && action.keywords) {
            action.keywords.forEach((kw: string) => {
              if (!(creature as any).keywords.includes(kw)) {
                (creature as any).keywords.push(kw);
              }
            });
            effect.affectedCardIds = effect.affectedCardIds || [];
            if (!effect.affectedCardIds.includes(creature.id))
              effect.affectedCardIds.push(creature.id);
          }
        });
      }
    });
  }

  private applyActiveEffectsToCreature(
    playerIndex: 0 | 1,
    creature: CreatureCard
  ) {
    // Iterate all active effects and apply ones that match this creature
    this.state.activeEffects.forEach((effect) => {
      const def = effectsRegistry[effect.id];
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
}
