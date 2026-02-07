import { useState, useEffect, useCallback } from "react";
import "../styles.css";
import { GameLog } from "./GameLog";
import { Controls } from "./Controls";
import { ActiveEffects } from "./ActiveEffects";
import { PlayerBoard } from "./PlayerBoard";
import { Hand } from "./Hand";
import { Modal, PlayCreatureModal } from "./Modal";
import { TargetSelectModal } from "./Modal";
import { CardDetailModal } from "./Modal/CardDetailModal";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  closeModal,
  closePlayCreatureModal,
  setSelectedHandCard,
  setSelectedAttacker,
  closeCardDetailModal,
  queueEffectNotification,
} from "../../store/uiSlice";
import backgroundImage from "../../assets/background.png";
import { useBattleEngine } from "../../hooks/useBattleEngine";
import { useGameInitialization } from "../../hooks/useGameInitialization";
import { CardActivationEffect } from "./Card/CardActivationEffect";
import { CardAttackAnimation } from "./Card/CardAttackAnimation";
import { useAnimationQueue } from "./Card/useAnimationQueue";
import { useAttackAnimation } from "../../hooks/useAttackAnimation";
import { useTrapActivation } from "../../hooks/useTrapActivation";
import { useDrawReminder } from "../../hooks/useDrawReminder";
import { useCardActions } from "../../hooks/useCardActions";
import { useCreatureActions } from "../../hooks/useCreatureActions";
import { useCardDetailModals } from "../../hooks/useCardDetailModals";
import { useAttackHandler } from "../../hooks/useAttackHandler";
import { CardType } from "../../cards/types";

export const Battle = () => {
  const dispatch = useAppDispatch();
  const {
    selectedHandCard,
    selectedAttacker,
    modal,
    playCreatureModal,
    isShowingEffectNotification,
  } = useAppSelector((state) => state.ui);

  const [aiSkillLevel] = useState(5);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // Animation queue - handles both activation and attack animations sequentially
  const {
    currentAnimation,
    queueActivation,
    queueAttack,
    completeCurrentAnimation,
  } = useAnimationQueue();

  // Use the battle engine hook for all state management
  const {
    engine,
    gameState,
    currentPlayer,
    opponent,
    isGameOver,
    initializeGame,
    draw,
    playCreature,
    playSupport,
    activateSupport,
    activateTrap,
    activateCreatureEffect,
    attack,
    toggleCreatureMode,
    endTurn,
    refresh,
    ai,
    setEffectCallback,
  } = useBattleEngine();

  // Use trap activation hook
  const { trapActivationCallbackRef } = useTrapActivation({
    engine,
    gameState,
    ai,
    activateTrap,
  });

  // Use attack animation hook
  const { aiAttackAnimationCallbackRef } = useAttackAnimation({
    engine,
    gameState,
    queueAttack,
  });

  // Close card detail modal when component unmounts (e.g., navigating away)
  useEffect(() => {
    return () => {
      dispatch(closeCardDetailModal());
    };
  }, [dispatch]);

  // Wire BattleEngine effect callback into the UI queue
  useEffect(() => {
    if (!engine) return;

    setEffectCallback((card, effectName) => {
      dispatch(
        queueEffectNotification({
          card,
          effectName,
          activeEffects: gameState ? gameState.activeEffects : [],
        }),
      );
    });

    return () => {
      if (engine) setEffectCallback(() => {});
    };
  }, [engine, dispatch, gameState, setEffectCallback]);

  // Game initialization hook
  const { showDeckLoadPrompt, handleNewGame, handleDeckLoadResponse } =
    useGameInitialization({
      initializeGame,
      aiSkillLevel,
      trapActivationCallbackRef,
      aiAttackAnimationCallbackRef,
      onClearUIState: useCallback(() => {
        dispatch(setSelectedHandCard(null));
        dispatch(setSelectedAttacker(null));
      }, [dispatch]),
    });

  const handleDraw = () => {
    if (isShowingEffectNotification) return;
    // The engine handles empty deck case automatically
    draw(gameState!.activePlayer);
  };

  // Use draw reminder hook
  const { checkNeedsToDraw, showDrawReminderModal } = useDrawReminder({
    gameState,
    handleDraw,
  });

  // Use card actions hook
  const {
    handlePlayCreature,
    handlePlayCreatureClick,
    handlePlaySupport,
    handleActivateSupport,
  } = useCardActions({
    engine,
    gameState,
    selectedHandCard,
    isShowingEffectNotification,
    checkNeedsToDraw,
    showDrawReminderModal,
    playCreature,
    playSupport,
    activateSupport,
    refresh,
    queueActivation,
  });

  // Use creature actions hook
  const { handleToggleMode, handleFlipFaceUp } = useCreatureActions({
    engine,
    gameState,
    checkNeedsToDraw,
    showDrawReminderModal,
    toggleCreatureMode,
  });

  // Use attack handler hook
  const { handleSelectAttacker, handleAttack, setAttackerRef } =
    useAttackHandler({
      engine,
      gameState,
      selectedAttacker,
      isShowingEffectNotification,
      checkNeedsToDraw,
      showDrawReminderModal,
      attack,
      activateTrap,
      queueAttack,
    });

  // Use card detail modals hook
  const {
    handleCreatureDoubleClick,
    handleSupportDoubleClick,
    handleHandCardDoubleClick,
  } = useCardDetailModals({ gameState });

  // Render deck load prompt if needed
  if (showDeckLoadPrompt) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            background: "linear-gradient(145deg, #2d3748, #1a202c)",
            border: "2px solid #4a5568",
            borderRadius: "10px",
            padding: "30px",
            maxWidth: "400px",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "#fff", marginBottom: "20px" }}>
            Load Saved Deck?
          </h2>
          <p style={{ color: "#cbd5e0", marginBottom: "30px" }}>
            You have a saved deck. Would you like to use it for this battle?
          </p>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}
          >
            <button
              onClick={() => handleDeckLoadResponse(true)}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(145deg, #48bb78, #38a169)",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Yes, Use My Deck
            </button>
            <button
              onClick={() => handleDeckLoadResponse(false)}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(145deg, #718096, #4a5568)",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              No, Random Deck
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!engine || !gameState || !currentPlayer || !opponent) {
    return <div>Loading...</div>;
  }

  // Always use player indices for consistent board positions
  const player1 = gameState.players[0]; // User (always bottom)
  const player2 = gameState.players[1]; // AI (always top)

  const handleEndTurn = () => {
    endTurn();
    dispatch(setSelectedHandCard(null));
    dispatch(setSelectedAttacker(null));
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
        <ActiveEffects
          activeEffects={gameState.activeEffects}
          players={gameState.players}
        />
        <PlayerBoard
          player={player2}
          gameState={gameState}
          currentPlayerState={player1}
          lifePoints={player2.lifePoints}
          isOpponent={true}
          isFirstTurn={gameState.turn === 1 && gameState.activePlayer === 0}
          selectedAttacker={selectedAttacker}
          onAttack={(targetLane, defenderElement) => {
            if (defenderElement) {
              handleAttack(targetLane, defenderElement);
            } else {
              handleAttack(targetLane);
            }
          }}
          onSetAttackerRef={setAttackerRef}
          onCreatureDoubleClick={(lane) => handleCreatureDoubleClick(lane, 1)}
          onSupportDoubleClick={(slot) => handleSupportDoubleClick(slot, 1)}
          onActivateCreatureEffect={(lane) => {
            // For opponent board clicks we guard in CreatureZone; still route to engine
            if (activateCreatureEffect && engine)
              activateCreatureEffect(1, lane);
          }}
          draggedCardId={null}
        />
        <PlayerBoard
          player={player1}
          gameState={gameState}
          lifePoints={player1.lifePoints}
          isOpponent={false}
          isFirstTurn={gameState.turn === 1 && gameState.activePlayer === 0}
          selectedHandCard={selectedHandCard}
          selectedAttacker={selectedAttacker}
          onPlayCreature={handlePlayCreatureClick}
          onPlaySupport={handlePlaySupport}
          onActivateSupport={handleActivateSupport}
          onActivateCreatureEffect={(lane, element) => {
            if (activateCreatureEffect && engine) {
              // Queue animation if element is provided
              const card = player1.lanes[lane];
              if (element && card) {
                queueActivation(card, element, () => {
                  activateCreatureEffect(0, lane);
                });
              } else {
                activateCreatureEffect(0, lane);
              }
            }
          }}
          onSelectAttacker={handleSelectAttacker}
          onSetAttackerRef={setAttackerRef}
          onToggleMode={handleToggleMode}
          onFlipFaceUp={handleFlipFaceUp}
          onCreatureDoubleClick={(lane) => handleCreatureDoubleClick(lane, 0)}
          onSupportDoubleClick={(slot) => handleSupportDoubleClick(slot, 0)}
          draggedCardId={draggedCardId}
        />
        <Hand
          hand={player1.hand}
          onSelectCard={(id) => dispatch(setSelectedHandCard(id))}
          onCardDoubleClick={handleHandCardDoubleClick}
          activeEffects={gameState.activeEffects}
          playerIndex={0}
          playerMomentum={player1.momentum}
          onDragStart={(cardId) => {
            setDraggedCardId(cardId);
            dispatch(setSelectedHandCard(cardId));
          }}
          onDragEnd={() => {
            // Don't clear draggedCardId here - wait for onCardDropped
          }}
          onCardDropped={(cardId, x, y) => {
            // Find what element is at the drop position
            const elements = document.elementsFromPoint(x, y);

            // Look for a drop zone element
            const dropZone = elements.find(
              (el) =>
                el.hasAttribute("data-drop-lane") ||
                el.hasAttribute("data-drop-support"),
            );

            if (dropZone) {
              const card = player1.hand.find((c) => c.id === cardId);
              if (!card) {
                setDraggedCardId(null);
                return;
              }

              // Ensure card is selected before playing
              dispatch(setSelectedHandCard(cardId));

              if (dropZone.hasAttribute("data-drop-lane")) {
                const lane = parseInt(dropZone.getAttribute("data-drop-lane")!);
                if (card.type === CardType.Creature) {
                  handlePlayCreatureClick(lane);
                }
              } else if (dropZone.hasAttribute("data-drop-support")) {
                const slot = parseInt(
                  dropZone.getAttribute("data-drop-support")!,
                );
                if (
                  card.type === CardType.Action ||
                  card.type === CardType.Trap
                ) {
                  handlePlaySupport(slot);
                }
              }
            }

            // Clear draggedCardId after processing drop
            setDraggedCardId(null);
          }}
        />
        <Controls
          phase={gameState.phase}
          isGameOver={isGameOver}
          handleDraw={handleDraw}
          handleEndTurn={handleEndTurn}
          startNewGame={handleNewGame}
          deckSize={player1.deck.length}
          isPlayerTurn={gameState.activePlayer === 0}
          isShowingEffectNotification={isShowingEffectNotification}
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
          onCancel={modal.onCancel || (() => dispatch(closeModal()))}
        />
        <TargetSelectModal />
        <CardDetailModal />
        {/* Activation Animation from Queue */}
        {currentAnimation?.type === "activation" && (
          <CardActivationEffect
            card={currentAnimation.data.card}
            isActivating={true}
            originBounds={currentAnimation.data.originBounds}
            onComplete={completeCurrentAnimation}
          />
        )}
        {/* Attack Animation from Queue */}
        {currentAnimation?.type === "attack" && (
          <CardAttackAnimation
            card={currentAnimation.data.card}
            attackerBounds={currentAnimation.data.attackerBounds}
            defenderBounds={currentAnimation.data.defenderBounds}
            damage={currentAnimation.data.damage}
            counterDamage={currentAnimation.data.counterDamage}
            onComplete={completeCurrentAnimation}
          />
        )}
      </div>
    </div>
  );
};
