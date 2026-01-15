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

  // State snapshot for replay/undo - only included on major state changes
  stateSnapshot?: GameStateSnapshot;

  // Flag to indicate this is a reversible action (for undo)
  reversible?: boolean;
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

// State snapshot for replay/undo functionality
export interface GameStateSnapshot {
  turn: number;
  phase: Phase;
  currentPlayerIndex: 0 | 1;
  hasDrawnThisTurn: boolean;
  winnerIndex: number | null;
  players: {
    id: string;
    deckSize: number;
    handSize: number;
    hp: number;
    creatures: Array<{
      id: string;
      name: string;
      hp: number;
      atk: number;
      def: number;
      mode: "ATTACK" | "DEFENSE";
      isFaceDown: boolean;
      activeEffects: string[];
    } | null>;
    support: Array<{
      id: string;
      name: string;
      isActive: boolean;
    } | null>;
    discardSize: number;
  }[];
  activeEffects: Array<{
    id: string;
    name: string;
    sourceCardId: string;
    turnsRemaining: number | null;
  }>;
}

/**
 * GameLogger class - manages structured logging for the battle system
 */
export class GameLogger {
  private events: GameLogEvent[] = [];
  private sequence = 0;
  private snapshotOnMajorEvents = true; // Enable automatic state snapshots
  private maxEvents = 100; // Cap events at 100 to prevent memory leak

  constructor(options?: {
    snapshotOnMajorEvents?: boolean;
    maxEvents?: number;
  }) {
    this.events = [];
    this.sequence = 0;
    this.snapshotOnMajorEvents = options?.snapshotOnMajorEvents ?? true;
    this.maxEvents = options?.maxEvents ?? 100;
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
   * Get events by type
   */
  getEventsByType<T extends GameLogEventType>(type: T): GameLogEvent<T>[] {
    return this.events.filter((e) => e.type === type) as GameLogEvent<T>[];
  }

  /**
   * Get events for a specific turn
   */
  getEventsByTurn(turn: number): GameLogEvent[] {
    return this.events.filter((e) => e.turn === turn);
  }

  /**
   * Get the last event with a state snapshot
   */
  getLastSnapshot(): GameLogEvent | null {
    for (let i = this.events.length - 1; i >= 0; i--) {
      if (this.events[i].stateSnapshot) {
        return this.events[i];
      }
    }
    return null;
  }

  /**
   * Get all reversible events (for undo functionality)
   */
  getReversibleEvents(): GameLogEvent[] {
    return this.events.filter((e) => e.reversible);
  }

  /**
   * Clear all log events
   */
  clear(): void {
    this.events = [];
    this.sequence = 0;
  }

  /**
   * Export log as JSON for network transmission or storage
   */
  toJSON(): string {
    return JSON.stringify({
      events: this.events,
      sequence: this.sequence,
      exportedAt: Date.now(),
    });
  }

  /**
   * Import log from JSON
   */
  fromJSON(json: string): void {
    const data = JSON.parse(json);
    this.events = data.events || [];
    this.sequence = data.sequence || 0;
  }

  /**
   * Create a state snapshot from current game state
   */
  createSnapshot(state: any): GameStateSnapshot {
    return {
      turn: state.turn,
      phase: state.phase,
      currentPlayerIndex: state.currentPlayerIndex,
      hasDrawnThisTurn: state.hasDrawnThisTurn,
      winnerIndex: state.winnerIndex,
      players: state.players.map((p: any) => ({
        id: p.id,
        deckSize: p.deck?.length || 0,
        handSize: p.hand?.length || 0,
        hp: p.hp,
        creatures: (p.lanes || p.creatures || []).map((c: any) =>
          c
            ? {
                id: c.id,
                name: c.name,
                hp: c.hp,
                atk: c.atk,
                def: c.def,
                mode: c.mode,
                isFaceDown: c.isFaceDown,
                activeEffects: c.activeEffects?.map((e: any) => e.id) || [],
              }
            : null
        ),
        support: (p.support || []).map((s: any) =>
          s
            ? {
                id: s.id,
                name: s.name,
                isActive: s.isActive,
              }
            : null
        ),
        discardSize: p.discardPile?.length || 0,
      })),
      activeEffects: (state.activeEffects || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        sourceCardId: e.sourceCardId,
        turnsRemaining: e.turnsRemaining,
      })),
    };
  }

  /**
   * Generic log method
   */
  log<TType extends GameLogEventType, TData = unknown>(
    params: Omit<GameLogEvent<TType, TData>, "id" | "seq" | "ts">,
    gameState?: any
  ): void {
    // In production, disable snapshots to save memory
    const isProduction = process.env.NODE_ENV === "production";
    const shouldSnapshot =
      !isProduction &&
      this.snapshotOnMajorEvents &&
      gameState &&
      this.isMajorEvent(params.type);

    const event: GameLogEvent<TType, TData> = {
      id: generateUUID(),
      seq: this.sequence++,
      ts: Date.now(),
      ...params,
      ...(shouldSnapshot && { stateSnapshot: this.createSnapshot(gameState) }),
    };
    this.events.push(event);

    // Prune old events if we exceed max (keep most recent)
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  /**
   * Check if event type should trigger a state snapshot
   */
  private isMajorEvent(type: GameLogEventType): boolean {
    return [
      "TURN_START",
      "PHASE_CHANGE",
      "CARD_PLAYED",
      "ATTACK_DECLARED",
      "CARD_DESTROYED",
      "GAME_END",
    ].includes(type);
  }

  /**
   * Convenience methods for common events
   */

  gameStart(turn: number, startingPlayer: PlayerId, gameState?: any): void {
    this.log(
      {
        turn,
        phase: "DRAW",
        actor: startingPlayer,
        type: "GAME_START",
        message: `Turn ${turn} begins - ${
          startingPlayer === 0 ? "Player 1" : "Player 2"
        }'s turn`,
        severity: "INFO",
      },
      gameState
    );
  }

  turnStart(
    turn: number,
    activePlayer: PlayerId,
    playerName: string,
    gameState?: any
  ): void {
    this.log(
      {
        turn,
        phase: "DRAW",
        actor: activePlayer,
        type: "TURN_START",
        message: `Turn ${turn} - ${playerName}'s turn`,
        severity: "INFO",
        entities: {
          players: [activePlayer],
        },
      },
      gameState
    );
  }

  phaseChange(
    turn: number,
    phase: Phase,
    message: string,
    gameState?: any
  ): void {
    this.log(
      {
        turn,
        phase,
        type: "PHASE_CHANGE",
        message,
        severity: "INFO",
      },
      gameState
    );
  }

  cardDrawn(
    turn: number,
    phase: Phase,
    player: PlayerId,
    playerName: string,
    cardId: string,
    cardName: string,
    deckRemaining: number,
    gameState?: any
  ): void {
    this.log<"CARD_DRAWN", CardDrawnData>(
      {
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
        reversible: false, // Drawing cards is not reversible
      },
      gameState
    );
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
