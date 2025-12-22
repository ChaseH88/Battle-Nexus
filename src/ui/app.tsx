import { useState, useEffect } from "react";
import { CardInterface, CardType } from "../cards/types";
import { CreatureCard } from "../cards/CreatureCard";
import { ActionCard } from "../cards/ActionCard";
import { SupportCard } from "../cards/SupportCard";
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
import { TargetSelectModal } from "./Battle/Modal";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  openModal,
  closeModal,
  openPlayCreatureModal,
  closePlayCreatureModal,
  setSelectedHandCard,
  setSelectedAttacker,
  openTargetSelectModal,
  closeTargetSelectModal,
} from "../store/uiSlice";
import backgroundImage from "../assets/background.png";
import { useBattleEngine } from "../hooks/useBattleEngine";

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
  const dispatch = useAppDispatch();
  const { selectedHandCard, selectedAttacker, modal, playCreatureModal } =
    useAppSelector((state) => state.ui);

  const [aiSkillLevel, setAiSkillLevel] = useState(5);

  // Use the battle engine hook for all state management
  const {
    engine,
    gameState,
    currentPlayer,
    opponent,
    isPlayerTurn,
    isGameOver,
    winner,
    initializeGame,
    draw,
    playCreature,
    playSupport,
    activateSupport,
    attack,
    toggleCreatureMode,
    endTurn,
    refresh,
  } = useBattleEngine();

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const deck1 = allCards.map(cardFactory);
    const deck2 = allCards.map(cardFactory);
    initializeGame(deck1, deck2, aiSkillLevel);
    dispatch(setSelectedHandCard(null));
    dispatch(setSelectedAttacker(null));
  };

  const checkNeedsToDraw = (): boolean => {
    if (!gameState) return false;
    // Check if it's the current player's turn and they haven't drawn yet
    return (
      gameState.activePlayer === 0 &&
      !gameState.hasDrawnThisTurn &&
      gameState.phase === "DRAW"
    );
  };

  const showDrawReminderModal = () => {
    dispatch(
      openModal({
        title: "Draw Required",
        message: "You must draw a card before taking any actions this turn.",
        onConfirm: () => {
          handleDraw();
          dispatch(closeModal());
        },
      })
    );
  };

  if (!engine || !gameState || !currentPlayer || !opponent) {
    return <div>Loading...</div>;
  }

  const handleDraw = () => {
    // Check if deck is empty before attempting draw
    if (currentPlayer.deck.length === 0) {
      // Auto-advance to main phase
      if (gameState.phase === "DRAW") {
        gameState.hasDrawnThisTurn = true;
        gameState.phase = "MAIN";
        engine.log(
          `${currentPlayer.id} has no cards to draw - Main Phase begins`
        );
      }
    } else {
      draw(gameState.activePlayer);
    }
  };

  const handlePlayCreature = (
    lane: number,
    faceDown: boolean = false,
    mode: "ATTACK" | "DEFENSE" = "ATTACK"
  ) => {
    if (!selectedHandCard) return;
    const card = currentPlayer.hand.find((c) => c.id === selectedHandCard);
    if (card?.type === CardType.Creature) {
      const success = playCreature(
        gameState.activePlayer,
        lane,
        selectedHandCard,
        faceDown,
        mode
      );
      if (success) {
        dispatch(setSelectedHandCard(null));
        dispatch(closePlayCreatureModal());
      }
    }
  };

  const handlePlayCreatureClick = (lane: number) => {
    if (checkNeedsToDraw()) {
      showDrawReminderModal();
      return;
    }
    if (!selectedHandCard) return;
    const card = currentPlayer.hand.find((c) => c.id === selectedHandCard);
    if (card?.type === CardType.Creature) {
      dispatch(
        openPlayCreatureModal({
          lane,
          creatureName: card.name,
        })
      );
    }
  };

  const handlePlaySupport = (slot: number, activate: boolean = false) => {
    if (checkNeedsToDraw()) {
      showDrawReminderModal();
      return;
    }
    if (!selectedHandCard) return;
    const card = currentPlayer.hand.find((c) => c.id === selectedHandCard);
    if (card?.type === CardType.Support || card?.type === CardType.Action) {
      const success = playSupport(
        gameState.activePlayer,
        slot,
        selectedHandCard,
        activate
      );
      if (success) {
        dispatch(setSelectedHandCard(null));
      }
    }
  };

  const handleActivateSupport = (slot: number) => {
    if (checkNeedsToDraw()) {
      showDrawReminderModal();
      return;
    }
    const card = currentPlayer.support[slot];
    if (!card || card.isActive) return;

    // If this support requires a target selection (e.g. Purge Beacon), open the target modal
    if (card.effectId === "purge_opponent_support") {
      // Build options from opponent support slots
      const opponentIndex = gameState.activePlayer === 0 ? 1 : 0;
      const opponentPlayer = gameState.players[opponentIndex];
      const options = opponentPlayer.support
        .map((s, i) => ({ label: s ? s.name : `Slot ${i} (empty)`, value: i }))
        .filter((o) => opponentPlayer.support[o.value] !== null);

      dispatch(
        openTargetSelectModal({
          title: `Select opponent support to remove`,
          message: `Choose a support card from ${opponentPlayer.id}`,
          options,
          onConfirm: (slotIndex: number) => {
            // Call engine directly for target-based activation
            engine.activateSupport(gameState.activePlayer as 0 | 1, slot, {
              targetPlayer: opponentIndex,
              targetLane: slotIndex,
            });
            refresh();
          },
        })
      );
      return;
    }

    dispatch(
      openModal({
        title: "Activate Card",
        message: `Do you want to activate ${card.name}?`,
        onConfirm: () => {
          activateSupport(gameState.activePlayer, slot);
          dispatch(closeModal());
        },
      })
    );
  };

  const handleSelectAttacker = (lane: number) => {
    if (checkNeedsToDraw()) {
      showDrawReminderModal();
      return;
    }
    const creature = currentPlayer.lanes[lane];
    if (!creature) return;
    dispatch(setSelectedAttacker(lane));
    dispatch(setSelectedHandCard(null));
  };

  const handleAttack = (targetLane: number) => {
    if (selectedAttacker === null) return;
    attack(gameState.activePlayer, selectedAttacker, targetLane);
    dispatch(setSelectedAttacker(null));
  };

  const handleEndTurn = () => {
    endTurn();
    dispatch(setSelectedHandCard(null));
    dispatch(setSelectedAttacker(null));
  };

  const handleToggleMode = (lane: number) => {
    if (checkNeedsToDraw()) {
      showDrawReminderModal();
      return;
    }
    toggleCreatureMode(gameState.activePlayer, lane);
  };

  const handleFlipFaceUp = (lane: number) => {
    if (checkNeedsToDraw()) {
      showDrawReminderModal();
      return;
    }
    const creature = currentPlayer.lanes[lane];
    if (!creature || !creature.isFaceDown) return;

    dispatch(
      openModal({
        title: "Flip Creature Face-Up",
        message: `Do you want to flip ${creature.name} face-up? This action cannot be reversed.`,
        onConfirm: () => {
          engine.flipCreatureFaceUp(gameState.activePlayer, lane);
          dispatch(closeModal());
        },
      })
    );
  };

  const handleSkillChange = (level: number) => {
    setAiSkillLevel(level);
    // Note: AI skill change will take effect on next game
  };

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      <div
        className="background"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
        }}
      >
        <img
          src={backgroundImage}
          style={{
            width: "100vw",
            height: "100vh",
            minHeight: 1000,
          }}
        />
      </div>
      <div className="game-container">
        <GameHeader
          isGameOver={isGameOver}
          winnerName={isGameOver && winner ? winner : ""}
          turn={gameState.turn}
          currentPlayerName={currentPlayer.id}
          phase={gameState.phase}
          onNewGame={startNewGame}
        />
        <ActiveEffects
          activeEffects={gameState.activeEffects}
          players={gameState.players}
        />
        <AIControls
          aiSkillLevel={aiSkillLevel}
          onSkillChange={handleSkillChange}
        />
        <PlayerBoard
          player={opponent}
          koCount={gameState.koCount[gameState.activePlayer === 0 ? 1 : 0]}
          isOpponent={true}
          isFirstTurn={gameState.turn === 1 && gameState.activePlayer === 0}
          selectedAttacker={selectedAttacker}
          onAttack={handleAttack}
        />
        <PlayerBoard
          player={currentPlayer}
          koCount={gameState.koCount[gameState.activePlayer]}
          isOpponent={false}
          isFirstTurn={gameState.turn === 1 && gameState.activePlayer === 0}
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
          onSelectCard={(id) => dispatch(setSelectedHandCard(id))}
        />
        <Controls
          phase={gameState.phase}
          isGameOver={isGameOver}
          handleDraw={handleDraw}
          handleEndTurn={handleEndTurn}
          startNewGame={startNewGame}
          deckSize={currentPlayer.deck.length}
        />
        <GameLog log={gameState.log} />
        <PlayCreatureModal
          isOpen={playCreatureModal.isOpen}
          creatureName={playCreatureModal.creatureName || ""}
          onPlayFaceUpAttack={() => {
            if (playCreatureModal.isOpen) {
              handlePlayCreature(playCreatureModal.lane!, false, "ATTACK");
            }
          }}
          onPlayFaceUpDefense={() => {
            if (playCreatureModal.isOpen) {
              handlePlayCreature(playCreatureModal.lane!, false, "DEFENSE");
            }
          }}
          onPlayFaceDownAttack={() => {
            if (playCreatureModal.isOpen) {
              handlePlayCreature(playCreatureModal.lane!, true, "ATTACK");
            }
          }}
          onPlayFaceDownDefense={() => {
            if (playCreatureModal.isOpen) {
              handlePlayCreature(playCreatureModal.lane!, true, "DEFENSE");
            }
          }}
          onCancel={() => dispatch(closePlayCreatureModal())}
        />
        <Modal
          isOpen={modal.isOpen}
          title={modal.title || ""}
          message={modal.message || ""}
          onConfirm={modal.onConfirm || (() => {})}
          onCancel={() => dispatch(closeModal())}
        />
        <TargetSelectModal />
      </div>
    </div>
  );
}
