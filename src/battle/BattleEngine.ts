import { GameState, getOpponentIndex } from "./GameState";
import { CardInterface, CardType, CreatureCard } from "../cards";
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

    resolveEffectsForCard({
      state: this.state,
      ownerIndex: playerIndex as 0 | 1,
      trigger: "ON_DRAW",
      cardEffectId: topCard.effectId,
    });
  }

  playCreature(playerIndex: number, lane: number, cardId: string): boolean {
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

  playSupport(playerIndex: 0 | 1, slot: number, cardId: string): boolean {
    if (this.state.winnerIndex !== null) return false;

    const player = this.state.players[playerIndex];

    // 3 support slots
    if (slot < 0 || slot > 2) return false;
    if (player.support[slot] !== null) return false;

    const card = player.hand.find((c) => c.id === cardId);
    if (!card || card.type !== CardType.Support) return false;

    moveCard(this.state, playerIndex, Zone.Hand, Zone.Support0, cardId, {
      toLane: slot,
    });

    this.log(`${player.id} played support ${card.name} to slot ${slot}`);

    resolveEffectsForCard({
      state: this.state,
      ownerIndex: playerIndex,
      cardEffectId: card.effectId,
      trigger: "ON_PLAY",
    });

    return true;
  }

  attack(playerIndex: 0 | 1, lane: number) {
    if (this.state.winnerIndex !== null) return;

    const attacker = this.state.players[playerIndex].lanes[
      lane
    ] as CreatureCard;
    if (!attacker) return;

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
      // direct hit still allowed but DOES NOT win the game anymore
      const damage = attacker.atk;
      opponent.hp -= damage;
      this.log(
        `${attacker.name} hit ${opponent.id} directly for ${damage} (HP now ${opponent.hp})`
      );
      return;
    }

    // lane combat
    if (attacker.atk > defender.def) {
      const extraDamage = attacker.atk - defender.def;

      // remove defender from lane and send to graveyard
      opponent.lanes[lane] = null;
      opponent.graveyard.push(defender as CardInterface);

      this.log(
        `${attacker.name} destroyed ${defender.name} and dealt ${extraDamage} extra damage to ${opponent.id}`
      );
      opponent.hp -= extraDamage;

      // REGISTER KO (this is what counts for victory now)
      this.registerKO(playerIndex, defender);
    } else {
      this.log(`${attacker.name} failed to destroy ${defender.name}`);
    }
  }

  endTurn() {
    if (this.state.winnerIndex !== null) return; // game finished
    this.state.activePlayer = getOpponentIndex(this.state.activePlayer);
    this.state.turn++;
    this.log(`Turn ${this.state.turn} begins`);
  }
}
