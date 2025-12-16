import { GameState, getOpponentIndex } from "./GameState";
import { CardInterface, CardType, CreatureCard } from "../cards";
import { SupportCard } from "../cards/SupportCard";
import { ActionCard } from "../cards/ActionCard";
import { moveCard } from "./ZoneEngine";
import { Zone } from "./zones";
import { resolveEffectsForCard } from "../effects/resolve";

export class BattleEngine {
  constructor(public state: GameState) {}

  log(msg: string) {
    this.state.log.push(msg);
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
      this.log(`${player.id} cannot draw — deck is empty.`);
      return;
    }

    // Move from Deck → Hand
    player.deck.shift();
    player.hand.push(topCard);

    this.log(`${player.id} drew ${topCard.name}`);

    // Mark that player has drawn this turn
    this.state.hasDrawnThisTurn = true;

    // Automatically move to main phase after drawing
    if (this.state.phase === "DRAW") {
      this.state.phase = "MAIN";
      this.log(`Main Phase begins`);
    }

    resolveEffectsForCard({
      state: this.state,
      ownerIndex: playerIndex as 0 | 1,
      trigger: "ON_DRAW",
      cardEffectId: topCard.effectId,
    });
  }

  playCreature(playerIndex: number, lane: number, cardId: string): boolean {
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

    this.log(`${player.id} summoned ${card.name} to lane ${lane}`);

    resolveEffectsForCard({
      state: this.state,
      ownerIndex: playerIndex as 0 | 1,
      cardEffectId: card.effectId,
      trigger: "ON_PLAY",
    });

    return true;
  }

  playSupport(
    playerIndex: 0 | 1,
    slot: number,
    cardId: string,
    activate: boolean = false
  ): boolean {
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

    const spellCard = player.support[slot] as SupportCard | ActionCard;

    if (activate) {
      spellCard.isActive = true;
      this.log(
        `${player.id} played and activated ${card.type.toLowerCase()} ${
          card.name
        } to slot ${slot}`
      );

      resolveEffectsForCard({
        state: this.state,
        ownerIndex: playerIndex,
        cardEffectId: card.effectId,
        trigger: "ON_PLAY",
      });
    } else {
      spellCard.isActive = false;
      this.log(
        `${player.id} set ${card.type.toLowerCase()} ${
          card.name
        } face-down to slot ${slot}`
      );
    }

    return true;
  }

  activateSupport(playerIndex: 0 | 1, slot: number): boolean {
    if (this.state.winnerIndex !== null) return false;

    // Must be in main phase
    if (this.state.phase !== "MAIN") {
      this.log("Cannot activate cards during draw phase. Draw a card first!");
      return false;
    }

    const player = this.state.players[playerIndex];
    const card = player.support[slot];

    if (
      !card ||
      (card.type !== CardType.Support && card.type !== CardType.Action)
    )
      return false;

    const spellCard = card as SupportCard | ActionCard;

    if (spellCard.isActive) {
      this.log(`${spellCard.name} is already active!`);
      return false;
    }

    spellCard.isActive = true;
    this.log(
      `${player.id} activated ${card.type.toLowerCase()} ${
        spellCard.name
      } from slot ${slot}`
    );

    resolveEffectsForCard({
      state: this.state,
      ownerIndex: playerIndex,
      cardEffectId: card.effectId,
      trigger: "ON_PLAY",
    });

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
    const creature = player.lanes[lane] as CreatureCard | null;

    if (!creature || creature.type !== CardType.Creature) return false;

    // Toggle mode
    const newMode = creature.mode === "ATTACK" ? "DEFENSE" : "ATTACK";
    creature.mode = newMode;

    this.log(`${creature.name} switched to ${newMode} mode`);
    return true;
  }

  attack(playerIndex: 0 | 1, lane: number) {
    if (this.state.winnerIndex !== null) return;

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

    const attacker = this.state.players[playerIndex].lanes[lane] as any;
    if (!attacker) return;

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
    const defender = opponent.lanes[lane] as CreatureCard | null;

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
          `${attacker.name} attacked lane ${lane} but no creature was there.`
        );
      }
      return;
    }

    // lane combat with HP system based on modes
    // ATTACK MODE vs ATTACK MODE: Both creatures deal damage to each other
    // ATTACK MODE vs DEFENSE MODE: Attacker deals damage based on ATK - DEF

    if (attacker.mode === "ATTACK" && defender.mode === "ATTACK") {
      // Both in attack mode - simultaneous damage
      const damageToDefender = Math.max(0, attacker.atk - defender.atk);
      const damageToAttacker = Math.max(0, defender.atk - attacker.atk);

      if (damageToDefender > 0) {
        defender.currentHp -= damageToDefender;
        this.log(
          `${attacker.name} (ATK: ${attacker.atk}) vs ${defender.name} (ATK: ${defender.atk}) - ${defender.name} takes ${damageToDefender} damage`
        );
        this.log(`${defender.name} HP: ${defender.currentHp}/${defender.hp}`);
      } else if (damageToDefender === 0) {
        this.log(
          `${attacker.name} (ATK: ${attacker.atk}) vs ${defender.name} (ATK: ${defender.atk}) - Equal strength, no damage!`
        );
      }

      if (damageToAttacker > 0) {
        attacker.currentHp -= damageToAttacker;
        this.log(
          `${defender.name} counter-attacks - ${attacker.name} takes ${damageToAttacker} damage`
        );
        this.log(`${attacker.name} HP: ${attacker.currentHp}/${attacker.hp}`);
      }

      // Check if defender is defeated
      if (defender.currentHp <= 0) {
        opponent.lanes[lane] = null;
        opponent.graveyard.push(defender as any);
        this.log(`${defender.name} was destroyed!`);
        this.registerKO(playerIndex, defender);
      }

      // Check if attacker is defeated
      if (attacker.currentHp <= 0) {
        this.state.players[playerIndex].lanes[lane] = null;
        this.state.players[playerIndex].graveyard.push(
          attacker as CardInterface
        );
        this.log(`${attacker.name} was destroyed in the exchange!`);
        this.registerKO(opponentIndex, attacker);
      }
    } else if (attacker.mode === "ATTACK" && defender.mode === "DEFENSE") {
      // Attacker vs defender in defense mode - ATK vs DEF
      const damageToDefender = Math.max(0, attacker.atk - defender.def);

      if (damageToDefender > 0) {
        defender.currentHp -= damageToDefender;
        this.log(
          `${attacker.name} (ATK: ${attacker.atk}) attacked ${defender.name} (DEF: ${defender.def}) for ${damageToDefender} damage`
        );
        this.log(`${defender.name} HP: ${defender.currentHp}/${defender.hp}`);

        // Check if defender is defeated
        if (defender.currentHp <= 0) {
          opponent.lanes[lane] = null;
          opponent.graveyard.push(defender as any);
          this.log(`${defender.name} was destroyed!`);
          this.registerKO(playerIndex, defender);
        }
      } else {
        // Attacker failed to penetrate defense
        this.log(
          `${attacker.name} (ATK: ${attacker.atk}) failed to penetrate ${defender.name}'s defense (DEF: ${defender.def})`
        );
        this.log(`${defender.name} blocked the attack!`);
      }
    }
  }

  endTurn() {
    if (this.state.winnerIndex !== null) return; // game finished

    // Reset hasAttackedThisTurn for all creatures on the current player's field
    const currentPlayer = this.state.players[this.state.activePlayer];
    currentPlayer.lanes.forEach((creature) => {
      if (creature && creature.type === CardType.Creature) {
        (creature as any).hasAttackedThisTurn = false;
      }
    });

    this.state.activePlayer = getOpponentIndex(this.state.activePlayer);
    this.state.turn++;
    this.state.phase = "DRAW";
    this.state.hasDrawnThisTurn = false;

    this.log(
      `Turn ${this.state.turn} begins - ${
        this.state.players[this.state.activePlayer].id
      }'s turn`
    );
    this.log(`Draw Phase - Draw a card to begin`);
  }
}
