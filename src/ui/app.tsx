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

  // Always use player indices for consistent board positions
  const player1 = gameState.players[0]; // User (always bottom)
  const player2 = gameState.players[1]; // AI (always top)
  const isPlayer1Turn = gameState.activePlayer === 0;

  const handleDraw = () => {
    // Check if deck is empty before attempting draw
    if (player1.deck.length === 0) {
      // Auto-advance to main phase
      if (gameState.phase === "DRAW") {
        gameState.hasDrawnThisTurn = true;
        gameState.phase = "MAIN";
        engine.log(`${player1.id} has no cards to draw - Main Phase begins`);
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
    const card = player1.hand.find((c) => c.id === selectedHandCard);
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
    const card = player1.hand.find((c) => c.id === selectedHandCard);
    if (card?.type === CardType.Creature) {
      dispatch(
        openPlayCreatureModal({
          lane,
          creatureName: card.name,
        })
      );
    }
  };

  const handlePlaySupport = (slot: number) => {
    if (checkNeedsToDraw()) {
      showDrawReminderModal();
      return;
    }
    if (!selectedHandCard) return;
    const card = player1.hand.find((c) => c.id === selectedHandCard);
    if (card?.type === CardType.Support || card?.type === CardType.Action) {
      const success = playSupport(
        0, // Player 1 only
        slot,
        selectedHandCard
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
    const card = player1.support[slot];
    if (!card || card.isActive) return;

    // Check if card is face down - must flip and activate
    if (card.isFaceDown) {
      // If this support requires a target selection (e.g. Purge Beacon), open the target modal
      if (card.effectId === "purge_opponent_support") {
        // Build options from opponent support slots (including face down cards)
        const opponentIndex = 1;
        const opponentPlayer = gameState.players[opponentIndex];
        const options = opponentPlayer.support
          .map((s, i) => ({
            label: s
              ? s.isFaceDown
                ? `Face-down card in slot ${i}`
                : s.name
              : `Slot ${i} (empty)`,
            value: i,
          }))
          .filter((o) => opponentPlayer.support[o.value] !== null);

        if (options.length === 0) {
          dispatch(
            openModal({
              title: "Cannot Activate",
              message: `${card.name} requires an opponent support card to target, but none are available. The card will be discarded.`,
              onConfirm: () => {
                // Activate anyway - effect will fail and card will be discarded
                engine.activateSupport(0 as 0 | 1, slot);
                refresh();
                dispatch(closeModal());
              },
            })
          );
          return;
        }

        dispatch(
          openTargetSelectModal({
            title: `Select opponent support to remove`,
            message: `Choose a support card from ${opponentPlayer.id}`,
            options,
            onConfirm: (slotIndex: number) => {
              // Call engine directly for target-based activation
              engine.activateSupport(0 as 0 | 1, slot, {
                targetPlayer: opponentIndex,
                targetLane: slotIndex,
              });
              refresh();
            },
          })
        );
        return;
      }

      // Handle cards that require targeting own Fire creatures (Ignite Burst)
      if (card.effectId === "boost_fire_and_extend_ignite") {
        const fireCreatures = player1.lanes
          .map((c, i) => ({ creature: c, lane: i }))
          .filter((item) => item.creature && item.creature.affinity === "FIRE");

        if (fireCreatures.length === 0) {
          dispatch(
            openModal({
              title: "Cannot Activate",
              message: `${card.name} requires a Fire creature to target, but you have none in play. The card will be discarded.`,
              onConfirm: () => {
                // Activate anyway - effect will fail and card will be discarded
                engine.activateSupport(0 as 0 | 1, slot);
                refresh();
                dispatch(closeModal());
              },
            })
          );
          return;
        }

        const options = fireCreatures.map(({ creature, lane }) => ({
          label: `${creature!.name} (Lane ${lane + 1}) - ${creature!.atk} ATK`,
          value: lane,
        }));

        dispatch(
          openTargetSelectModal({
            title: `Select Fire creature to boost`,
            message: `Choose a Fire creature to gain +200 ATK and IGNITE`,
            options,
            onConfirm: (lane: number) => {
              engine.activateSupport(0 as 0 | 1, slot, {
                lane,
              });
              refresh();
            },
          })
        );
        return;
      }

      // Standard activation (no targeting required)
      dispatch(
        openModal({
          title: "Activate Card",
          message: `Flip ${card.name} face-up and activate it?`,
          onConfirm: () => {
            activateSupport(0, slot);
            dispatch(closeModal());
          },
        })
      );
    }
  };

  const handleSelectAttacker = (lane: number) => {
    if (checkNeedsToDraw()) {
      showDrawReminderModal();
      return;
    }
    const creature = player1.lanes[lane];
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
    const creature = player1.lanes[lane];
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
          currentPlayerName={isPlayer1Turn ? player1.id : player2.id}
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
          player={player2}
          koCount={gameState.koCount[1]}
          isOpponent={true}
          isFirstTurn={gameState.turn === 1 && gameState.activePlayer === 0}
          selectedAttacker={selectedAttacker}
          onAttack={handleAttack}
        />
        <PlayerBoard
          player={player1}
          koCount={gameState.koCount[0]}
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
          hand={player1.hand}
          selectedHandCard={selectedHandCard}
          onSelectCard={(id) => dispatch(setSelectedHandCard(id))}
        />
        <Controls
          phase={gameState.phase}
          isGameOver={isGameOver}
          handleDraw={handleDraw}
          handleEndTurn={handleEndTurn}
          startNewGame={startNewGame}
          deckSize={player1.deck.length}
          isPlayerTurn={gameState.activePlayer === 0}
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
