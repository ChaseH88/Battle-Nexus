import { useState, useEffect, useRef, useCallback } from "react";
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
    openCardDetailModal,
  closeCardDetailModal,
  queueEffectNotification,
  dequeueEffectNotification,
  setShowingEffectNotification,
} from "../store/uiSlice";
import backgroundImage from "../assets/background.png";
import { useBattleEngine } from "../hooks/useBattleEngine";
import { getEffectMetadata } from "../effects/metadata";
import { effectsRegistry } from "../effects/registry";
import { loadDeckFromLocalStorage, hasSavedDeck } from "../utils/deckLoader";

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
  const {
    selectedHandCard,
    selectedAttacker,
    modal,
    playCreatureModal,
    effectNotificationQueue,
    isShowingEffectNotification,
  } = useAppSelector((state) => state.ui);

  const [aiSkillLevel, setAiSkillLevel] = useState(5);
  const [showDeckLoadPrompt, setShowDeckLoadPrompt] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Ref to store trap activation callback - needs to be stable and have access to latest state
  const trapActivationCallbackRef =
    useRef<
      (
        defenderIndex: 0 | 1,
        attackerLane: number,
        targetLane: number
      ) => Promise<boolean>
    >(undefined);

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
    activateTrap,
    activateCreatureEffect,
    attack,
    toggleCreatureMode,
    endTurn,
    refresh,
    ai,
  } = useBattleEngine();

  // Create stable trap activation callback
  const trapActivationCallback = useCallback(
    async (
      defenderIndex: 0 | 1,
      attackerLane: number,
      targetLane: number
    ): Promise<boolean> => {
      if (!engine || !gameState) return false;

      const traps = engine.getActivatableTraps(defenderIndex);
      if (!traps || traps.length === 0) return false;

      const trap = traps[0];

      // If defender is AI (player 1), let AI decide
      if (defenderIndex === 1 && ai) {
        const shouldActivate = ai.shouldActivateTrap(
          gameState,
          trap.card,
          attackerLane,
          targetLane
        );

        if (shouldActivate) {
          activateTrap(defenderIndex, trap.slot, { targetLane });
          return true;
        }
        return false;
      }

      // If defender is human (player 0), prompt them
      if (defenderIndex === 0) {
        return new Promise<boolean>((resolve) => {
          dispatch(
            openModal({
              title: "Trap Activation",
              message: `Your opponent is attacking! Activate ${trap.card.name}?`,
              onConfirm: () => {
                // Activate trap then resolve true
                activateTrap(defenderIndex, trap.slot, { targetLane });
                dispatch(closeModal());
                resolve(true);
              },
              onCancel: () => {
                // Don't activate trap
                dispatch(closeModal());
                resolve(false);
              },
            })
          );
        });
      }

      return false;
    },
    [engine, gameState, ai, activateTrap, dispatch]
  );

  // Update ref whenever callback changes
  useEffect(() => {
    trapActivationCallbackRef.current = trapActivationCallback;
  }, [trapActivationCallback]);

  // Wire BattleEngine effect callback into the UI queue
  useEffect(() => {
    if (!engine) return;

    engine.onEffectActivated = (card, effectName) => {
      dispatch(
        queueEffectNotification({
          card,
          effectName,
          activeEffects: gameState ? gameState.activeEffects : [],
        })
      );
    };

    return () => {
      if (engine) engine.onEffectActivated = undefined;
    };
  }, [engine, dispatch, gameState]);

  // Process the effect notification queue: show CardDetailModal for 1s per effect
  useEffect(() => {
    // Only process if we have items and we're not currently showing one
    if (effectNotificationQueue.length === 0 || isShowingEffectNotification) {
      return;
    }

    const next = effectNotificationQueue[0];

    // Mark as showing and open modal
    dispatch(setShowingEffectNotification(true));
    dispatch(
      openCardDetailModal({
        card: next.card,
        activeEffects: next.activeEffects,
      })
    );

    // Auto-close after 1 second
    const timer = setTimeout(() => {
      dispatch(closeCardDetailModal());
      dispatch(dequeueEffectNotification());
      dispatch(setShowingEffectNotification(false));
    }, 1000);

    return () => clearTimeout(timer);
    // Only re-run when queue changes, not when isShowingEffectNotification changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectNotificationQueue, dispatch]);

  const startNewGameWithCustomDeck = useCallback(() => {
    const customDeck = loadDeckFromLocalStorage();
    const deck1 =
      customDeck && customDeck.length >= 20
        ? [...customDeck].sort(() => 0.5 - Math.random())
        : allCards.map(cardFactory).sort(() => 0.5 - Math.random());
    const deck2 = allCards.map(cardFactory).sort(() => 0.5 - Math.random());

    // Wrap trap callback in a function that uses the ref
    const trapCallback = async (
      defenderIndex: 0 | 1,
      attackerLane: number,
      targetLane: number
    ): Promise<boolean> => {
      if (trapActivationCallbackRef.current) {
        return trapActivationCallbackRef.current(
          defenderIndex,
          attackerLane,
          targetLane
        );
      }
      return false;
    };

    initializeGame(deck1, deck2, aiSkillLevel, trapCallback);
    dispatch(setSelectedHandCard(null));
    dispatch(setSelectedAttacker(null));
  }, [initializeGame, aiSkillLevel, dispatch]);

  const startNewGame = useCallback(() => {
    const deck1 = allCards.map(cardFactory).sort(() => 0.5 - Math.random());
    const deck2 = allCards.map(cardFactory).sort(() => 0.5 - Math.random());

    // Wrap trap callback in a function that uses the ref
    const trapCallback = async (
      defenderIndex: 0 | 1,
      attackerLane: number,
      targetLane: number
    ): Promise<boolean> => {
      if (trapActivationCallbackRef.current) {
        return trapActivationCallbackRef.current(
          defenderIndex,
          attackerLane,
          targetLane
        );
      }
      return false;
    };

    initializeGame(deck1, deck2, aiSkillLevel, trapCallback);
    dispatch(setSelectedHandCard(null));
    dispatch(setSelectedAttacker(null));
  }, [initializeGame, aiSkillLevel, dispatch]);

  const handleNewGame = useCallback(() => {
    if (hasSavedDeck()) {
      setShowDeckLoadPrompt(true);
    } else {
      startNewGame();
    }
  }, [startNewGame]);

  useEffect(() => {
    // Check if user has a saved deck and offer to load it on initial mount
    if (!isInitialized) {
      if (hasSavedDeck()) {
        setShowDeckLoadPrompt(true);
      } else {
        startNewGame();
      }
      setIsInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              onClick={() => {
                setShowDeckLoadPrompt(false);
                startNewGameWithCustomDeck();
              }}
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
              onClick={() => {
                setShowDeckLoadPrompt(false);
                startNewGame();
              }}
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
  const isPlayer1Turn = gameState.activePlayer === 0;

  const handleDraw = () => {
    if (isShowingEffectNotification) return;
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
    if (isShowingEffectNotification) return;
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
    if (isShowingEffectNotification) return;
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
    if (isShowingEffectNotification) return;
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
    if (isShowingEffectNotification) return;
    if (checkNeedsToDraw()) {
      showDrawReminderModal();
      return;
    }
    const card = player1.support[slot];
    if (!card || card.isActive) return;

    // Check if card is face down - must flip and activate
    if (card.isFaceDown) {
      // Check if this is a trap card (ON_DEFEND trigger) - traps can't be manually activated
      if (card.effectId) {
        // Check the effect's trigger from the registry
        const effectDef = effectsRegistry[card.effectId];
        if (effectDef && effectDef.trigger === "ON_DEFEND") {
          // This is a trap - cannot be manually activated
          return;
        }
      }

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
    if (isShowingEffectNotification) return;
    if (selectedAttacker === null) return;

    // Determine defender index
    const defenderIndex = gameState.activePlayer === 0 ? 1 : 0;

    // If defender is human (player 0) and they have face-down traps, prompt them
    const traps = engine?.getActivatableTraps(defenderIndex) || [];
    if (traps.length > 0 && defenderIndex === 0) {
      const trap = traps[0];
      dispatch(
        openModal({
          title: "Trap Activation",
          message: `Your opponent is attacking! Activate ${trap.card.name}?`,
          onConfirm: () => {
            // Activate the trap (will resolve and be discarded)
            activateTrap(defenderIndex, trap.slot, { targetLane });

            // Proceed with the attack after trap resolution
            attack(gameState.activePlayer, selectedAttacker, targetLane);
            dispatch(setSelectedAttacker(null));
            dispatch(closeModal());
          },
          onCancel: () => {
            // Don't activate trap, just proceed with attack
            attack(gameState.activePlayer, selectedAttacker, targetLane);
            dispatch(setSelectedAttacker(null));
            dispatch(closeModal());
          },
        })
      );
      return;
    }

    // No trap prompt needed — proceed with attack
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
          lifePoints={player2.lifePoints}
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
          lifePoints={player1.lifePoints}
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
      </div>
    </div>
  );
}
