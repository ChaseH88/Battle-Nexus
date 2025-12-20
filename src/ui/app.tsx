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
import { GameHeader } from "./Battle/GameHeader";
import { ActiveEffects } from "./Battle/ActiveEffects";
import { AIControls } from "./Battle/AIControls";
import { PlayerBoard } from "./Battle/PlayerBoard";
import { Hand } from "./Battle/Hand";
import { Modal, PlayCreatureModal } from "./Battle/Modal";

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
  const [playCreatureModalState, setPlayCreatureModalState] = useState<{
    isOpen: boolean;
    lane: number;
    creatureName: string;
  } | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
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

  const handlePlayCreature = (
    lane: number,
    faceDown: boolean = false,
    mode: "ATTACK" | "DEFENSE" = "ATTACK"
  ) => {
    if (!selectedHandCard) return;
    const card = currentPlayer.hand.find((c) => c.id === selectedHandCard);
    if (card?.type === CardType.Creature) {
      const success = engine.playCreature(
        game.activePlayer,
        lane,
        selectedHandCard,
        faceDown,
        mode
      );
      if (success) {
        setSelectedHandCard(null);
        setPlayCreatureModalState(null);
        refresh();
      }
    }
  };

  const handlePlayCreatureClick = (lane: number) => {
    if (!selectedHandCard) return;
    const card = currentPlayer.hand.find((c) => c.id === selectedHandCard);
    if (card?.type === CardType.Creature) {
      setPlayCreatureModalState({
        isOpen: true,
        lane,
        creatureName: card.name,
      });
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
    const card = currentPlayer.support[slot];
    if (!card || card.isActive) return;

    setModalState({
      isOpen: true,
      title: "Activate Card",
      message: `Do you want to activate ${card.name}?`,
      onConfirm: () => {
        const success = engine.activateSupport(game.activePlayer, slot);
        if (success) {
          refresh();
        }
        setModalState(null);
      },
    });
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
    const creature = currentPlayer.lanes[lane];
    if (!creature || !creature.isFaceDown) return;

    setModalState({
      isOpen: true,
      title: "Flip Creature Face-Up",
      message: `Do you want to flip ${creature.name} face-up? This action cannot be reversed.`,
      onConfirm: () => {
        const success = engine.flipCreatureFaceUp(game.activePlayer, lane);
        if (success) {
          refresh();
        }
        setModalState(null);
      },
    });
  };

  const handleSkillChange = (level: number) => {
    setAiSkillLevel(level);
    if (ai) {
      ai.setSkillLevel(level);
    }
  };

  return (
    <div className="game-container">
      <GameHeader
        isGameOver={isGameOver}
        winnerName={game.players[game.winnerIndex!]?.id || ""}
        turn={game.turn}
        currentPlayerName={currentPlayer.id}
        phase={game.phase}
        onNewGame={startNewGame}
      />

      <ActiveEffects
        activeEffects={game.activeEffects}
        players={game.players}
      />

      <AIControls
        aiSkillLevel={aiSkillLevel}
        onSkillChange={handleSkillChange}
      />

      <PlayerBoard
        player={opponent}
        koCount={game.koCount[game.activePlayer === 0 ? 1 : 0]}
        isOpponent={true}
        isFirstTurn={game.turn === 1 && game.activePlayer === 0}
        selectedAttacker={selectedAttacker}
        onAttack={handleAttack}
      />

      <PlayerBoard
        player={currentPlayer}
        koCount={game.koCount[game.activePlayer]}
        isOpponent={false}
        isFirstTurn={game.turn === 1 && game.activePlayer === 0}
        selectedHandCard={selectedHandCard}
        selectedAttacker={selectedAttacker}
        onPlayCreature={handlePlayCreatureClick}
        onPlaySupport={handlePlaySupport}
        onActivateSupport={handleActivateSupport}
        onSelectAttacker={handleSelectAttacker}
        onToggleMode={handleToggleMode}
        onFlipFaceUp={handleFlipFaceUp}
      />

      <Hand
        hand={currentPlayer.hand}
        selectedHandCard={selectedHandCard}
        onSelectCard={setSelectedHandCard}
      />

      <Controls
        phase={game.phase}
        isGameOver={isGameOver}
        handleDraw={handleDraw}
        handleEndTurn={handleEndTurn}
        startNewGame={startNewGame}
      />

      <GameLog log={game.log} />

      <PlayCreatureModal
        isOpen={playCreatureModalState?.isOpen || false}
        creatureName={playCreatureModalState?.creatureName || ""}
        onPlayFaceUpAttack={() => {
          if (playCreatureModalState) {
            handlePlayCreature(playCreatureModalState.lane, false, "ATTACK");
          }
        }}
        onPlayFaceUpDefense={() => {
          if (playCreatureModalState) {
            handlePlayCreature(playCreatureModalState.lane, false, "DEFENSE");
          }
        }}
        onPlayFaceDownAttack={() => {
          if (playCreatureModalState) {
            handlePlayCreature(playCreatureModalState.lane, true, "ATTACK");
          }
        }}
        onPlayFaceDownDefense={() => {
          if (playCreatureModalState) {
            handlePlayCreature(playCreatureModalState.lane, true, "DEFENSE");
          }
        }}
        onCancel={() => setPlayCreatureModalState(null)}
      />

      <Modal
        isOpen={modalState?.isOpen || false}
        title={modalState?.title || ""}
        message={modalState?.message || ""}
        onConfirm={modalState?.onConfirm || (() => {})}
        onCancel={() => setModalState(null)}
      />
    </div>
  );
}
