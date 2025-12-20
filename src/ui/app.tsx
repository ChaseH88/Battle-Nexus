import { useState, useEffect } from "react";
import { BattleEngine } from "../battle/BattleEngine";
import { createGameState } from "../battle/GameState";
import { createPlayerState } from "../battle/PlayerState";
import { CardInterface, CardType } from "../cards/types";
import { CreatureCard } from "../cards/CreatureCard";
import { ActionCard } from "../cards/ActionCard";
import { SupportCard } from "../cards/SupportCard";
import { AIPlayer } from "../battle/AIPlayer";
import cardsData from "../static/card-data/bn-core.json";
import "./styles.css";
import { GameLog } from "./Battle/GameLog";
import { Controls } from "./Battle/Controls";

function cardFactory(raw: any): CardInterface {
  switch (raw.type) {
    case CardType.Creature:
      return new CreatureCard(raw);
    case CardType.Action:
      return new ActionCard(raw);
    case CardType.Support:
      return new SupportCard(raw);
    default:
      throw new Error(`Unknown card type: ${raw.type}`);
  }
}

const allCards = (cardsData as any[])
  .map(cardFactory)
  .sort(() => 0.5 - Math.random());

export default function App() {
  const [engine, setEngine] = useState<BattleEngine | null>(null);
  const [ai, setAi] = useState<AIPlayer | null>(null);
  const [aiSkillLevel, setAiSkillLevel] = useState(5);
  const [selectedHandCard, setSelectedHandCard] = useState<string | null>(null);
  const [selectedAttacker, setSelectedAttacker] = useState<number | null>(null);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    startNewGame();
  }, []);

  // AI turn execution
  useEffect(() => {
    if (!engine || !ai) return;
    if (engine.state.winnerIndex !== null) return;
    if (engine.state.activePlayer !== 1) return;

    const executeTurn = async () => {
      console.log("[AI] Taking turn...");
      await ai.takeTurn(engine.state);
      console.log("[AI] Turn complete, refreshing UI");
      refresh();
    };

    const timer = setTimeout(executeTurn, 1000);
    return () => clearTimeout(timer);
  }, [engine?.state.activePlayer, engine?.state.phase, ai]);

  const startNewGame = () => {
    const deck1 = allCards.map(cardFactory);
    const deck2 = allCards.map(cardFactory);
    const p1 = createPlayerState("Player 1", deck1);
    const p2 = createPlayerState("AI Opponent", deck2);
    const game = createGameState(p1, p2);
    const newEngine = new BattleEngine(game);

    // Draw initial hands (before turn 1)
    for (let i = 0; i < 5; i++) {
      const p1Card = p1.deck.shift();
      const p2Card = p2.deck.shift();
      if (p1Card) p1.hand.push(p1Card);
      if (p2Card) p2.hand.push(p2Card);
    }

    // Start in draw phase for first player
    newEngine.log("Turn 1 begins - Player 1's turn");
    newEngine.log("Draw Phase - Draw a card to begin");

    setEngine(newEngine);

    // Always initialize AI as player 2
    const aiPlayer = new AIPlayer(
      { skillLevel: aiSkillLevel, playerIndex: 1 },
      newEngine
    );
    setAi(aiPlayer);

    setSelectedHandCard(null);
    setSelectedAttacker(null);
  };

  const refresh = () => forceUpdate({});

  if (!engine) return <div>Loading...</div>;

  const game = engine.state;
  const currentPlayer = game.players[game.activePlayer];
  const opponent = game.players[game.activePlayer === 0 ? 1 : 0];
  const isGameOver = game.winnerIndex !== null;

  const handleDraw = () => {
    engine.draw(game.activePlayer);
    refresh();
  };

  const handlePlayCreature = (lane: number, faceDown: boolean = false) => {
    if (!selectedHandCard) return;
    const card = currentPlayer.hand.find((c) => c.id === selectedHandCard);
    if (card?.type === CardType.Creature) {
      const success = engine.playCreature(
        game.activePlayer,
        lane,
        selectedHandCard,
        faceDown
      );
      if (success) {
        setSelectedHandCard(null);
        refresh();
      }
    }
  };

  const handlePlaySupport = (slot: number, activate: boolean = false) => {
    if (!selectedHandCard) return;
    const card = currentPlayer.hand.find((c) => c.id === selectedHandCard);
    if (card?.type === CardType.Support || card?.type === CardType.Action) {
      const success = engine.playSupport(
        game.activePlayer,
        slot,
        selectedHandCard,
        activate
      );
      if (success) {
        setSelectedHandCard(null);
        refresh();
      }
    }
  };

  const handleActivateSupport = (slot: number) => {
    const success = engine.activateSupport(game.activePlayer, slot);
    if (success) {
      refresh();
    }
  };

  const handleSelectAttacker = (lane: number) => {
    const creature = currentPlayer.lanes[lane];
    if (!creature) return;
    setSelectedAttacker(lane);
    setSelectedHandCard(null);
  };

  const handleAttack = (targetLane: number) => {
    if (selectedAttacker === null) return;
    engine.attack(game.activePlayer, selectedAttacker, targetLane);
    setSelectedAttacker(null);
    refresh();
  };

  const handleEndTurn = () => {
    engine.endTurn();
    setSelectedHandCard(null);
    setSelectedAttacker(null);
    refresh();
  };

  const handleToggleMode = (lane: number) => {
    const success = engine.toggleCreatureMode(game.activePlayer, lane);
    if (success) {
      refresh();
    }
  };

  const handleFlipFaceUp = (lane: number) => {
    const success = engine.flipCreatureFaceUp(game.activePlayer, lane);
    if (success) {
      refresh();
    }
  };

  const handleSkillChange = (level: number) => {
    setAiSkillLevel(level);
    if (ai) {
      ai.setSkillLevel(level);
    }
  };

  const renderCard = (
    card: CardInterface | null,
    onClick?: () => void,
    isSelected?: boolean,
    showFaceDown?: boolean
  ) => {
    if (!card) {
      return (
        <div className="card-slot empty" onClick={onClick}>
          Empty
        </div>
      );
    }

    const isCreature = card.type === CardType.Creature;
    const isSupport = card.type === CardType.Support;
    const isAction = card.type === CardType.Action;
    const creature = isCreature ? (card as CreatureCard) : null;
    const support = isSupport ? (card as SupportCard) : null;
    const action = isAction ? (card as ActionCard) : null;

    // Face-down creature card
    if (showFaceDown && creature && creature.isFaceDown) {
      return (
        <div
          className={`card-slot creature face-down ${
            creature.mode === "DEFENSE" ? "defense-mode" : ""
          }`}
          onClick={onClick}
        >
          <div className="card-name">???</div>
          <div className="card-type">FACE-DOWN</div>
          <div className="card-mode-badge">{creature.mode}</div>
        </div>
      );
    }

    // Face-down support or action card
    if (showFaceDown && (support || action) && !(support || action)!.isActive) {
      return (
        <div
          className={`card-slot ${card.type.toLowerCase()} face-down`}
          onClick={onClick}
        >
          <div className="card-name">???</div>
          <div className="card-type">FACE-DOWN</div>
        </div>
      );
    }

    return (
      <div
        className={`card-slot ${card.type.toLowerCase()} ${
          selectedHandCard === card.id || isSelected ? "selected" : ""
        } ${creature && creature.currentHp <= 0 ? "defeated" : ""} ${
          creature && creature.hasAttackedThisTurn ? "exhausted" : ""
        } ${creature && creature.mode === "DEFENSE" ? "defense-mode" : ""} ${
          creature && creature.isFaceDown ? "face-down" : ""
        } ${
          (support || action) && (support || action)!.isActive ? "active" : ""
        }`}
        onClick={onClick}
      >
        <div className="card-name">{card.name}</div>
        {creature && (
          <>
            <div className="card-mode-badge">{creature.mode}</div>
            <div className="card-stats">
              <span
                className={`atk ${creature.isAtkModified ? "modified" : ""}`}
              >
                ATK: {creature.atk}
                {creature.isAtkModified && (
                  <span className="base-stat">({creature.baseAtk})</span>
                )}
              </span>
              <span
                className={`def ${creature.isDefModified ? "modified" : ""}`}
              >
                DEF: {creature.def}
                {creature.isDefModified && (
                  <span className="base-stat">({creature.baseDef})</span>
                )}
              </span>
            </div>
            <div className="card-hp">
              <span className="hp-label">HP:</span>
              <span
                className={`hp-value ${
                  creature.currentHp < creature.hp * 0.3 ? "low" : ""
                }`}
              >
                {creature.currentHp}/{creature.hp}
              </span>
            </div>
            {creature.hasAttackedThisTurn && (
              <div className="attacked-badge">ATTACKED</div>
            )}
          </>
        )}
        {(support || action) && (support || action)!.isActive && (
          <div className="active-badge">ACTIVE</div>
        )}
        <div className="card-description">{card.description}</div>
        <div className="card-type">{card.type}</div>
        {creature?.affinity && (
          <div className="card-affinity">{creature.affinity}</div>
        )}
      </div>
    );
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>Battle Nexus</h1>
        {isGameOver ? (
          <div className="game-over">
            <h2>Game Over! {game.players[game.winnerIndex!].id} Wins!</h2>
            <button onClick={startNewGame}>New Game</button>
          </div>
        ) : (
          <div className="turn-info">
            <span>Turn: {game.turn}</span>
            <span>Active: {currentPlayer.id}</span>
            <span className={`phase ${game.phase.toLowerCase()}`}>
              Phase: {game.phase}
            </span>
          </div>
        )}
      </div>

      {/* Active Effects Panel */}
      {game.activeEffects.length > 0 && (
        <div className="active-effects-panel">
          <h4>⚡ Active Effects</h4>
          <div className="effects-list">
            {game.activeEffects.map((effect, i) => (
              <div key={i} className="effect-item">
                <span className="effect-name">{effect.name}</span>
                <span className="effect-source">
                  from {effect.sourceCardName}
                </span>
                {effect.statModifiers && (
                  <span className="effect-stats">
                    {effect.statModifiers.atk && (
                      <span className="stat-mod atk">
                        +{effect.statModifiers.atk} ATK
                      </span>
                    )}
                    {effect.statModifiers.def && (
                      <span className="stat-mod def">
                        +{effect.statModifiers.def} DEF
                      </span>
                    )}
                  </span>
                )}
                {effect.affectedCardIds &&
                  effect.affectedCardIds.length > 0 && (
                    <span className="affected-count">
                      ({effect.affectedCardIds.length} card
                      {effect.affectedCardIds.length !== 1 ? "s" : ""})
                    </span>
                  )}
                {effect.turnsRemaining !== undefined && (
                  <span className="effect-duration">
                    ({effect.turnsRemaining} turn
                    {effect.turnsRemaining !== 1 ? "s" : ""})
                  </span>
                )}
                <span className={`effect-owner p${effect.playerIndex}`}>
                  [{game.players[effect.playerIndex].id}]
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Controls */}
      <div className="ai-controls">
        <div className="skill-selector">
          <label>AI Skill Level: {aiSkillLevel}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={aiSkillLevel}
            onChange={(e) => handleSkillChange(parseInt(e.target.value))}
          />
          <div className="skill-labels">
            <span>Beginner</span>
            <span>Intermediate</span>
            <span>Expert</span>
          </div>
        </div>
      </div>

      {/* Opponent Board */}
      <div className="player-board opponent">
        <div className="player-info">
          <h3>{opponent.id}</h3>
          <div className="kos">
            KOs: {game.koCount[game.activePlayer === 0 ? 1 : 0]}/3
          </div>
          <div className="deck">Deck: {opponent.deck.length}</div>
          <div className="hand">Hand: {opponent.hand.length}</div>
          <div className="graveyard-display">
            <h4>Graveyard ({opponent.graveyard.length})</h4>
            <div className="graveyard-cards">
              {opponent.graveyard.slice(-3).map((card, i) => (
                <div key={i} className="graveyard-card-mini">
                  {card.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="support-zone">
          <h4>Support</h4>
          <div className="support-slots">
            {opponent.support.map((card, i) => (
              <div key={i}>{renderCard(card, undefined, false, true)}</div>
            ))}
          </div>
        </div>

        <div className="creature-zone">
          <h4>Creatures</h4>
          <div className="lanes">
            {opponent.lanes.map((card, i) => (
              <div key={i} className="lane">
                <div className="lane-label">Lane {i}</div>
                {renderCard(card, undefined, false, true)}
                {selectedAttacker !== null && (
                  <button
                    className="attack-here"
                    onClick={() => handleAttack(i)}
                    disabled={game.turn === 1 && game.activePlayer === 0}
                  >
                    {game.turn === 1 && game.activePlayer === 0
                      ? "Cannot Attack (Turn 1)"
                      : `Attack ${card ? "Creature" : "Directly"}`}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Player Board */}
      <div className="player-board current">
        <div className="creature-zone">
          <h4>Your Creatures</h4>
          <div className="lanes">
            {currentPlayer.lanes.map((card, i) => (
              <div key={i} className="lane">
                <div className="lane-label">Lane {i}</div>
                {renderCard(
                  card,
                  () =>
                    card &&
                    !(game.turn === 1 && game.activePlayer === 0) &&
                    handleSelectAttacker(i),
                  selectedAttacker === i
                )}
                {card && card.type === CardType.Creature && (
                  <>
                    <button
                      className="toggle-mode-btn"
                      onClick={() => handleToggleMode(i)}
                    >
                      Switch Mode
                    </button>
                    {(card as CreatureCard).isFaceDown && (
                      <button
                        className="flip-btn"
                        onClick={() => handleFlipFaceUp(i)}
                      >
                        Flip Face-Up
                      </button>
                    )}
                  </>
                )}
                {!card &&
                  selectedHandCard &&
                  (() => {
                    const handCard = currentPlayer.hand.find(
                      (c) => c.id === selectedHandCard
                    );
                    return handCard?.type === CardType.Creature ? (
                      <div className="creature-play-actions">
                        <button
                          className="play-here face-up-btn"
                          onClick={() => handlePlayCreature(i, false)}
                        >
                          Play Face-Up
                        </button>
                        <button
                          className="play-here face-down-btn"
                          onClick={() => handlePlayCreature(i, true)}
                        >
                          Set Face-Down
                        </button>
                      </div>
                    ) : null;
                  })()}
              </div>
            ))}
          </div>
        </div>

        <div className="support-zone">
          <h4>Your Support</h4>
          <div className="support-slots">
            {currentPlayer.support.map((card, i) => (
              <div key={i} className="support-slot">
                {renderCard(card, () => {
                  if (
                    card &&
                    (card.type === CardType.Support ||
                      card.type === CardType.Action)
                  ) {
                    const spellCard = card as SupportCard | ActionCard;
                    if (!spellCard.isActive) {
                      handleActivateSupport(i);
                    }
                  }
                })}
                {!card &&
                  selectedHandCard &&
                  (() => {
                    const handCard = currentPlayer.hand.find(
                      (c) => c.id === selectedHandCard
                    );
                    return handCard?.type === CardType.Support ||
                      handCard?.type === CardType.Action ? (
                      <div className="support-actions">
                        <button
                          className="play-here face-down-btn"
                          onClick={() => handlePlaySupport(i, false)}
                        >
                          Set Face-Down
                        </button>
                        <button
                          className="play-here activate-btn"
                          onClick={() => handlePlaySupport(i, true)}
                        >
                          Activate
                        </button>
                      </div>
                    ) : null;
                  })()}
              </div>
            ))}
          </div>
        </div>

        <div className="player-info">
          <h3>{currentPlayer.id}</h3>
          <div className="kos">KOs: {game.koCount[game.activePlayer]}/3</div>
          <div className="deck">Deck: {currentPlayer.deck.length}</div>
          <div className="graveyard-display">
            <h4>Graveyard ({currentPlayer.graveyard.length})</h4>
            <div className="graveyard-cards">
              {currentPlayer.graveyard.slice(-3).map((card, i) => (
                <div key={i} className="graveyard-card-mini">
                  {card.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hand */}
      <div className="hand-zone">
        <h4>Your Hand</h4>
        <div className="hand-cards">
          {currentPlayer.hand.map((card) => (
            <div key={card.id}>
              {renderCard(card, () => setSelectedHandCard(card.id))}
            </div>
          ))}
        </div>
      </div>
      <Controls
        phase={game.phase}
        isGameOver={isGameOver}
        handleDraw={handleDraw}
        handleEndTurn={handleEndTurn}
        startNewGame={startNewGame}
      />
      <GameLog log={game.log} />
    </div>
  );
}
