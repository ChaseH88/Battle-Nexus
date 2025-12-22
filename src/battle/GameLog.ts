export type Phase = "DRAW" | "MAIN";
export type PlayerId = 0 | 1;

// --- UUID Generation (Node 16 compatible) ---

/**
 * Generate a simple UUID v4-like string compatible with Node 16
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface CardRef {
  id: string;
  name: string;
  type?: string;
}

export interface EffectRef {
  id: string;
  name: string;
}

export interface LaneRef {
  player: PlayerId;
  index: number;
}

export interface SlotRef {
  player: PlayerId;
  index: number;
}

export type GameLogEventType =
  | "GAME_START"
  | "TURN_START"
  | "PHASE_CHANGE"
  | "CARD_DRAWN"
  | "CARD_PLAYED"
  | "CARD_ACTIVATED"
  | "CARD_FLIPPED"
  | "ATTACK_DECLARED"
  | "ATTACK_DIRECT"
  | "DAMAGE_DEALT"
  | "CARD_DESTROYED"
  | "EFFECT_TRIGGERED"
  | "EFFECT_APPLIED"
  | "EFFECT_EXPIRED"
  | "MODE_CHANGED"
  | "TURN_END"
  | "GAME_END"
  | "INFO"
  | "WARNING"
  | "ERROR";

export interface GameLogEvent<
  TType extends GameLogEventType = GameLogEventType,
  TData = unknown
> {
  id: string; // uuid
  seq: number; // monotonically increasing
  ts: number; // Date.now()
  turn: number;
  phase?: Phase;
  actor?: PlayerId; // who caused it (if applicable)
  type: TType;
  message: string; // display string (your current log line)
  severity?: "INFO" | "WARN" | "ERROR";

  // Optional structured references for UI + replay
  entities?: {
    players?: PlayerId[];
    cards?: CardRef[];
    effects?: EffectRef[];
    lanes?: LaneRef[];
    slots?: SlotRef[];
  };

  // Typed payload (per event type) + raw line for debugging
  data?: TData;
  raw?: string; // original unparsed string (optional)
}

// Specific event data types
export interface CardDrawnData {
  cardId: string;
  cardName: string;
  deckRemaining: number;
}

export interface CardPlayedData {
  cardId: string;
  cardName: string;
  cardType: string;
  lane?: number;
  slot?: number;
  faceDown?: boolean;
  mode?: "ATTACK" | "DEFENSE";
}

export interface AttackData {
  attackerId: string;
  attackerName: string;
  attackerLane: number;
  targetId?: string;
  targetName?: string;
  targetLane?: number;
  isDirect: boolean;
  damage?: number;
}

export interface DamageData {
  targetId: string;
  targetName: string;
  amount: number;
  hpBefore: number;
  hpAfter: number;
}

export interface CardDestroyedData {
  cardId: string;
  cardName: string;
  reason: "BATTLE" | "EFFECT" | "COST";
  lane?: number;
  slot?: number;
}

export interface EffectTriggeredData {
  effectId: string;
  effectName: string;
  sourceCardId: string;
  sourceCardName: string;
  trigger: string;
}

export interface ModeChangedData {
  cardId: string;
  cardName: string;
  lane: number;
  oldMode: "ATTACK" | "DEFENSE";
  newMode: "ATTACK" | "DEFENSE";
}

/**
 * GameLogger class - manages structured logging for the battle system
 */
export class GameLogger {
  private events: GameLogEvent[] = [];
  private sequence = 0;

  constructor() {
    this.events = [];
    this.sequence = 0;
  }

  /**
   * Get all log events
   */
  getEvents(): GameLogEvent[] {
    return this.events;
  }

  /**
   * Get only the message strings (for legacy compatibility)
   */
  getMessages(): string[] {
    return this.events.map((e) => e.message);
  }

  /**
   * Clear all log events
   */
  clear(): void {
    this.events = [];
    this.sequence = 0;
  }

  /**
   * Generic log method
   */
  log<TType extends GameLogEventType, TData = unknown>(
    params: Omit<GameLogEvent<TType, TData>, "id" | "seq" | "ts">
  ): void {
    const event: GameLogEvent<TType, TData> = {
      id: generateUUID(),
      seq: this.sequence++,
      ts: Date.now(),
      ...params,
    };
    this.events.push(event);
  }

  /**
   * Convenience methods for common events
   */

  gameStart(turn: number, startingPlayer: PlayerId): void {
    this.log({
      turn,
      phase: "DRAW",
      actor: startingPlayer,
      type: "GAME_START",
      message: `Turn ${turn} begins - ${
        startingPlayer === 0 ? "Player 1" : "Player 2"
      }'s turn`,
      severity: "INFO",
    });
  }

  turnStart(turn: number, activePlayer: PlayerId, playerName: string): void {
    this.log({
      turn,
      phase: "DRAW",
      actor: activePlayer,
      type: "TURN_START",
      message: `Turn ${turn} - ${playerName}'s turn`,
      severity: "INFO",
      entities: {
        players: [activePlayer],
      },
    });
  }

  phaseChange(turn: number, phase: Phase, message: string): void {
    this.log({
      turn,
      phase,
      type: "PHASE_CHANGE",
      message,
      severity: "INFO",
    });
  }

  cardDrawn(
    turn: number,
    phase: Phase,
    player: PlayerId,
    playerName: string,
    cardId: string,
    cardName: string,
    deckRemaining: number
  ): void {
    this.log<"CARD_DRAWN", CardDrawnData>({
      turn,
      phase,
      actor: player,
      type: "CARD_DRAWN",
      message: `${playerName} drew ${cardName}`,
      severity: "INFO",
      entities: {
        players: [player],
        cards: [{ id: cardId, name: cardName }],
      },
      data: {
        cardId,
        cardName,
        deckRemaining,
      },
    });
  }

  cardPlayed(
    turn: number,
    phase: Phase,
    player: PlayerId,
    playerName: string,
    card: CardRef,
    options: {
      lane?: number;
      slot?: number;
      faceDown?: boolean;
      mode?: "ATTACK" | "DEFENSE";
    }
  ): void {
    const { lane, slot, faceDown, mode } = options;
    let message = `${playerName} played ${card.name}`;
    if (faceDown) message += " (face-down)";
    if (mode) message += ` in ${mode} mode`;
    if (lane !== undefined) message += ` to lane ${lane + 1}`;
    if (slot !== undefined) message += ` to support slot ${slot + 1}`;

    const entities: GameLogEvent["entities"] = {
      players: [player],
      cards: [card],
    };
    if (lane !== undefined) entities.lanes = [{ player, index: lane }];
    if (slot !== undefined) entities.slots = [{ player, index: slot }];

    this.log<"CARD_PLAYED", CardPlayedData>({
      turn,
      phase,
      actor: player,
      type: "CARD_PLAYED",
      message,
      severity: "INFO",
      entities,
      data: {
        cardId: card.id,
        cardName: card.name,
        cardType: card.type || "unknown",
        lane,
        slot,
        faceDown,
        mode,
      },
    });
  }

  cardActivated(
    turn: number,
    phase: Phase,
    player: PlayerId,
    playerName: string,
    card: CardRef,
    slot: number
  ): void {
    this.log({
      turn,
      phase,
      actor: player,
      type: "CARD_ACTIVATED",
      message: `${playerName} activated ${card.name}`,
      severity: "INFO",
      entities: {
        players: [player],
        cards: [card],
        slots: [{ player, index: slot }],
      },
    });
  }

  cardFlipped(
    turn: number,
    phase: Phase,
    player: PlayerId,
    playerName: string,
    card: CardRef,
    lane: number
  ): void {
    this.log({
      turn,
      phase,
      actor: player,
      type: "CARD_FLIPPED",
      message: `${playerName} flipped ${card.name} face-up`,
      severity: "INFO",
      entities: {
        players: [player],
        cards: [card],
        lanes: [{ player, index: lane }],
      },
    });
  }

  attack(
    turn: number,
    phase: Phase,
    attacker: {
      player: PlayerId;
      playerName: string;
      card: CardRef;
      lane: number;
    },
    target?: {
      player: PlayerId;
      playerName: string;
      card: CardRef;
      lane: number;
    }
  ): void {
    const isDirect = !target;
    const message = isDirect
      ? `${attacker.playerName}'s ${attacker.card.name} attacks directly!`
      : `${attacker.playerName}'s ${attacker.card.name} attacks ${target.playerName}'s ${target.card.name}`;

    const entities: GameLogEvent["entities"] = {
      players: isDirect ? [attacker.player] : [attacker.player, target!.player],
      cards: isDirect ? [attacker.card] : [attacker.card, target!.card],
      lanes: isDirect
        ? [{ player: attacker.player, index: attacker.lane }]
        : [
            { player: attacker.player, index: attacker.lane },
            { player: target!.player, index: target!.lane },
          ],
    };

    this.log<"ATTACK_DECLARED" | "ATTACK_DIRECT", AttackData>({
      turn,
      phase,
      actor: attacker.player,
      type: isDirect ? "ATTACK_DIRECT" : "ATTACK_DECLARED",
      message,
      severity: "INFO",
      entities,
      data: {
        attackerId: attacker.card.id,
        attackerName: attacker.card.name,
        attackerLane: attacker.lane,
        targetId: target?.card.id,
        targetName: target?.card.name,
        targetLane: target?.lane,
        isDirect,
      },
    });
  }

  damage(
    turn: number,
    phase: Phase,
    player: PlayerId,
    card: CardRef,
    amount: number,
    hpBefore: number,
    hpAfter: number
  ): void {
    this.log<"DAMAGE_DEALT", DamageData>({
      turn,
      phase,
      type: "DAMAGE_DEALT",
      message: `${card.name}: HP ${hpBefore} → ${hpAfter}`,
      severity: "INFO",
      entities: {
        cards: [card],
      },
      data: {
        targetId: card.id,
        targetName: card.name,
        amount,
        hpBefore,
        hpAfter,
      },
    });
  }

  cardDestroyed(
    turn: number,
    phase: Phase,
    player: PlayerId,
    playerName: string,
    card: CardRef,
    reason: "BATTLE" | "EFFECT" | "COST",
    location?: { lane?: number; slot?: number }
  ): void {
    this.log<"CARD_DESTROYED", CardDestroyedData>({
      turn,
      phase,
      type: "CARD_DESTROYED",
      message: `${playerName}'s ${card.name} was destroyed`,
      severity: "WARN",
      entities: {
        players: [player],
        cards: [card],
        lanes:
          location?.lane !== undefined
            ? [{ player, index: location.lane }]
            : undefined,
        slots:
          location?.slot !== undefined
            ? [{ player, index: location.slot }]
            : undefined,
      },
      data: {
        cardId: card.id,
        cardName: card.name,
        reason,
        lane: location?.lane,
        slot: location?.slot,
      },
    });
  }

  effectTriggered(
    turn: number,
    phase: Phase,
    effectId: string,
    effectName: string,
    sourceCard: CardRef,
    trigger: string
  ): void {
    this.log<"EFFECT_TRIGGERED", EffectTriggeredData>({
      turn,
      phase,
      type: "EFFECT_TRIGGERED",
      message: `Effect triggered: ${effectName} (${trigger})`,
      severity: "INFO",
      entities: {
        cards: [sourceCard],
        effects: [{ id: effectId, name: effectName }],
      },
      data: {
        effectId,
        effectName,
        sourceCardId: sourceCard.id,
        sourceCardName: sourceCard.name,
        trigger,
      },
    });
  }

  effectApplied(
    turn: number,
    phase: Phase,
    effectName: string,
    description: string
  ): void {
    this.log({
      turn,
      phase,
      type: "EFFECT_APPLIED",
      message: `  ${description}`,
      severity: "INFO",
    });
  }

  effectExpired(
    turn: number,
    phase: Phase,
    effectId: string,
    effectName: string
  ): void {
    this.log({
      turn,
      phase,
      type: "EFFECT_EXPIRED",
      message: `Effect expired: ${effectName}`,
      severity: "INFO",
      entities: {
        effects: [{ id: effectId, name: effectName }],
      },
    });
  }

  modeChanged(
    turn: number,
    phase: Phase,
    player: PlayerId,
    playerName: string,
    card: CardRef,
    lane: number,
    oldMode: "ATTACK" | "DEFENSE",
    newMode: "ATTACK" | "DEFENSE"
  ): void {
    this.log<"MODE_CHANGED", ModeChangedData>({
      turn,
      phase,
      actor: player,
      type: "MODE_CHANGED",
      message: `${playerName} switched ${card.name} to ${newMode} mode`,
      severity: "INFO",
      entities: {
        players: [player],
        cards: [card],
        lanes: [{ player, index: lane }],
      },
      data: {
        cardId: card.id,
        cardName: card.name,
        lane,
        oldMode,
        newMode,
      },
    });
  }

  turnEnd(turn: number, player: PlayerId, playerName: string): void {
    this.log({
      turn,
      phase: "MAIN",
      actor: player,
      type: "TURN_END",
      message: `${playerName} ends their turn`,
      severity: "INFO",
      entities: {
        players: [player],
      },
    });
  }

  gameEnd(
    turn: number,
    winner: PlayerId,
    winnerName: string,
    reason: string
  ): void {
    this.log({
      turn,
      type: "GAME_END",
      message: `${winnerName} wins! ${reason}`,
      severity: "INFO",
      entities: {
        players: [winner],
      },
    });
  }

  info(turn: number, phase: Phase | undefined, message: string): void {
    this.log({
      turn,
      phase,
      type: "INFO",
      message,
      severity: "INFO",
    });
  }

  warning(turn: number, phase: Phase | undefined, message: string): void {
    this.log({
      turn,
      phase,
      type: "WARNING",
      message,
      severity: "WARN",
    });
  }

  error(turn: number, phase: Phase | undefined, message: string): void {
    this.log({
      turn,
      phase,
      type: "ERROR",
      message,
      severity: "ERROR",
    });
  }
}
