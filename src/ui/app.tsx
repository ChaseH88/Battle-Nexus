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
import { CardDetailModal } from "./Battle/Modal/CardDetailModal";
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
  openCardDetailModal,
} from "../store/uiSlice";
import backgroundImage from "../assets/background.png";
import { useBattleEngine } from "../hooks/useBattleEngine";
import { getEffectMetadata } from "../effects/metadata";

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
    isGameOver,
    winner,
    initializeGame,
    draw,
    playCreature,
    playSupport,
    activateSupport,
    activateCreatureEffect,
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
      // Get metadata once and use it for all checks
      const metadata = card.effectId ? getEffectMetadata(card.effectId) : null;
      const requiresTargeting = metadata?.targeting?.required ?? false;

      if (card.effectId && requiresTargeting) {
        // Check if activation is possible
        const activationCheck = metadata?.canActivate
          ? metadata.canActivate(gameState, 0)
          : { canActivate: true };

        if (!activationCheck.canActivate) {
          dispatch(
            openModal({
              title: "Cannot Activate",
              message: `${card.name}: ${activationCheck.reason}. The card will be discarded.`,
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

        // Get valid targets
        const options = metadata?.getValidTargets?.(gameState, 0) || [];

        if (options.length === 0) {
          dispatch(
            openModal({
              title: "Cannot Activate",
              message: `${card.name} has no valid targets. The card will be discarded.`,
              onConfirm: () => {
                engine.activateSupport(0 as 0 | 1, slot);
                refresh();
                dispatch(closeModal());
              },
            })
          );
          return;
        }

        // Open target selection modal with metadata-driven configuration
        dispatch(
          openTargetSelectModal({
            title: metadata?.targeting?.description || "Select target",
            message: `Choose a target for ${card.name}`,
            options,
            onConfirm: (targetValue: number) => {
              // Determine what the target value represents based on effect type
              const eventData: any = {};

              if (metadata?.targeting?.targetType === "OPPONENT_SUPPORT") {
                eventData.targetPlayer = 1;
                eventData.targetLane = targetValue;
              } else if (
                metadata?.targeting?.targetType?.includes("CREATURE")
              ) {
                eventData.targetLane = targetValue;
                eventData.lane = targetValue; // Also set lane for effect handler
              }

              engine.activateSupport(0 as 0 | 1, slot, eventData);
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

    // Cannot select creatures in defense mode as attackers
    if (creature.mode === "DEFENSE") {
      return;
    }

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

  const handleCreatureDoubleClick = (lane: number, playerIndex: 0 | 1) => {
    const player = gameState.players[playerIndex];
    const card = player.lanes[lane];
    if (!card) return;

    // Get active effects that affect this card
    const cardEffects = gameState.activeEffects.filter((effect) =>
      effect.affectedCardIds?.includes(card.id)
    );

    dispatch(
      openCardDetailModal({
        card,
        activeEffects: cardEffects,
      })
    );
  };

  const handleSupportDoubleClick = (slot: number, playerIndex: 0 | 1) => {
    const player = gameState.players[playerIndex];
    const card = player.support[slot];
    if (!card) return;

    // Get active effects that affect this card
    const cardEffects = gameState.activeEffects.filter((effect) =>
      effect.affectedCardIds?.includes(card.id)
    );

    dispatch(
      openCardDetailModal({
        card,
        activeEffects: cardEffects,
      })
    );
  };

  const handleHandCardDoubleClick = (card: CardInterface) => {
    // Hand cards don't have active effects on them yet
    dispatch(
      openCardDetailModal({
        card,
        activeEffects: [],
      })
    );
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
          currentPlayerState={player1}
          koCount={gameState.koCount[1]}
          isOpponent={true}
          isFirstTurn={gameState.turn === 1 && gameState.activePlayer === 0}
          selectedAttacker={selectedAttacker}
          onAttack={handleAttack}
          onCreatureDoubleClick={(lane) => handleCreatureDoubleClick(lane, 1)}
          onSupportDoubleClick={(slot) => handleSupportDoubleClick(slot, 1)}
          onActivateCreatureEffect={(lane) => {
            // For opponent board clicks we guard in CreatureZone; still route to engine
            if (activateCreatureEffect && engine)
              activateCreatureEffect(1, lane);
          }}
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
          onActivateCreatureEffect={(lane) => {
            if (activateCreatureEffect && engine)
              activateCreatureEffect(0, lane);
          }}
          onSelectAttacker={handleSelectAttacker}
          onToggleMode={handleToggleMode}
          onFlipFaceUp={handleFlipFaceUp}
          onCreatureDoubleClick={(lane) => handleCreatureDoubleClick(lane, 0)}
          onSupportDoubleClick={(slot) => handleSupportDoubleClick(slot, 0)}
        />
        <Hand
          hand={player1.hand}
          selectedHandCard={selectedHandCard}
          onSelectCard={(id) => dispatch(setSelectedHandCard(id))}
          onCardDoubleClick={handleHandCardDoubleClick}
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
        <CardDetailModal />
      </div>
    </div>
  );
}
