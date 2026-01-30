import { useState, useEffect, useRef, useCallback } from "react";
import { CardInterface, CardType } from "../cards/types";
import { CreatureCard } from "../cards/CreatureCard";
import { ActionCard } from "../cards/ActionCard";
import { SupportCard } from "../cards/SupportCard";
import { TrapCard } from "../cards/TrapCard";
import cardsData from "../static/card-data/bn-core.json";
import "./styles.css";
import { GameLog } from "./Battle/GameLog";
import { Controls } from "./Battle/Controls";
import { ActiveEffects } from "./Battle/ActiveEffects";
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
  queueEffectNotification,
} from "../store/uiSlice";
import backgroundImage from "../assets/background.png";
import { useBattleEngine } from "../hooks/useBattleEngine";
import { getEffectMetadata } from "../effects/metadata";
import { effectsRegistry } from "../effects/registry";
import {
  loadDeckFromLocalStorage,
  hasSavedDeck,
  loadAIDeck,
} from "../utils/deckLoader";
import { getEffectiveCreatureStats } from "../battle/MomentumPressure";
import { CardActivationEffect } from "./Battle/Card/CardActivationEffect";
import { CardAttackAnimation } from "./Battle/Card/CardAttackAnimation";
import { useAnimationQueue } from "./Battle/Card/useAnimationQueue";

function cardFactory(raw: any): CardInterface {
  switch (raw.type) {
    case CardType.Creature:
      return new CreatureCard(raw);
    case CardType.Action:
      return new ActionCard(raw);
    case CardType.Support:
      return new SupportCard(raw);
    case CardType.Trap:
      return new TrapCard(raw);
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
    isShowingEffectNotification,
  } = useAppSelector((state) => state.ui);

  const [aiSkillLevel] = useState(5);
  const [showDeckLoadPrompt, setShowDeckLoadPrompt] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // Animation queue - handles both activation and attack animations sequentially
  const {
    currentAnimation,
    queueActivation,
    queueAttack,
    completeCurrentAnimation,
  } = useAnimationQueue();

  // Store refs for attack animation
  const attackerRef = useRef<HTMLElement | null>(null);

  // Ref to store trap activation callback - needs to be stable and have access to latest state
  const trapActivationCallbackRef =
    useRef<
      (
        defenderIndex: 0 | 1,
        attackerLane: number,
        targetLane: number,
      ) => Promise<boolean>
    >(undefined);

  // Ref to store AI attack animation callback - needs to be stable and have access to latest state
  const aiAttackAnimationCallbackRef =
    useRef<(attackerLane: number, targetLane: number | null) => Promise<void>>(
      undefined,
    );

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
  } = useBattleEngine();

  // Create stable trap activation callback for ON_DEFEND triggers (combat)
  const trapActivationCallback = useCallback(
    async (
      defenderIndex: 0 | 1,
      attackerLane: number,
      targetLane: number,
    ): Promise<boolean> => {
      if (!engine || !gameState) return false;

      // Get traps that activate on defend (combat)
      const traps = engine.getActivatableTraps(defenderIndex, "ON_DEFEND");
      if (!traps || traps.length === 0) return false;

      const trap = traps[0];

      // If defender is AI (player 1), let AI decide
      if (defenderIndex === 1 && ai) {
        const shouldActivate = ai.shouldActivateTrap(
          gameState,
          trap.card,
          attackerLane,
          targetLane,
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
            }),
          );
        });
      }

      return false;
    },
    [engine, gameState, ai, activateTrap, dispatch],
  );

  // Update ref whenever callback changes
  useEffect(() => {
    trapActivationCallbackRef.current = trapActivationCallback;
  }, [trapActivationCallback]);

  // Create stable AI attack animation callback
  const aiAttackAnimationCallback = useCallback(
    async (attackerLane: number, targetLane: number | null): Promise<void> => {
      // Query DOM for attacker element (AI is player 1, opponent board)
      const attackerElement = document.querySelector(
        `[data-testid="opponent-creature-lane-${attackerLane}"] > div`,
      ) as HTMLElement | null;

      // Query DOM for defender element (player is player 0)
      const defenderElement =
        targetLane !== null
          ? (document.querySelector(
              `[data-testid="creature-lane-${targetLane}"] > div`,
            ) as HTMLElement | null)
          : null;

      if (!attackerElement || !gameState) {
        // Fallback: execute attack without animation
        if (engine) {
          engine.attack(
            1,
            attackerLane,
            targetLane === null ? undefined : targetLane,
          );
        }
        return;
      }

      const player2 = gameState.players[1]; // AI
      const player1 = gameState.players[0]; // Human
      const attackerCard = player2.lanes[attackerLane];
      const defenderCard =
        targetLane !== null ? player1.lanes[targetLane] : null;

      if (!attackerCard) {
        return;
      }

      // Calculate damage using effective stats with momentum buffs
      let damageToDefender = 0;
      let damageToAttacker = 0;

      // Get effective stats with momentum buffs
      const attackerStats = getEffectiveCreatureStats(
        attackerCard,
        player2.momentum,
      );

      if (defenderCard && defenderElement) {
        const defenderStats = getEffectiveCreatureStats(
          defenderCard,
          player1.momentum,
        );

        // Combat damage calculation
        if (attackerCard.mode === "ATTACK" && defenderCard.mode === "ATTACK") {
          damageToDefender = attackerStats.atk;
          damageToAttacker = Math.max(0, defenderStats.atk - attackerStats.def);
        } else if (
          attackerCard.mode === "ATTACK" &&
          defenderCard.mode === "DEFENSE"
        ) {
          damageToDefender = Math.max(0, attackerStats.atk - defenderStats.def);
          damageToAttacker = 0;
        }
      } else {
        // Direct attack
        damageToDefender = attackerStats.atk;
        damageToAttacker = 0;
      }

      // Queue animation and wait for completion
      return new Promise<void>((resolve) => {
        // If no defender element (direct attack), use player's board center as target
        const targetElement =
          defenderElement ||
          (document.querySelector(
            '[data-testid="creature-lane-0"]',
          ) as HTMLElement);

        if (targetElement) {
          queueAttack(
            attackerCard,
            attackerElement,
            targetElement,
            damageToDefender,
            damageToAttacker,
            () => {
              // Execute the actual attack after animation
              if (engine) {
                engine.attack(
                  1,
                  attackerLane,
                  targetLane === null ? undefined : targetLane,
                );
              }
              resolve();
            },
          );
        } else {
          // Fallback
          if (engine) {
            engine.attack(
              1,
              attackerLane,
              targetLane === null ? undefined : targetLane,
            );
          }
          resolve();
        }
      });
    },
    [engine, gameState, queueAttack],
  );

  // Update ref whenever callback changes
  useEffect(() => {
    aiAttackAnimationCallbackRef.current = aiAttackAnimationCallback;
  }, [aiAttackAnimationCallback]);

  // Wire BattleEngine effect callback into the UI queue
  useEffect(() => {
    if (!engine) return;

    engine.onEffectActivated = (card, effectName) => {
      dispatch(
        queueEffectNotification({
          card,
          effectName,
          activeEffects: gameState ? gameState.activeEffects : [],
        }),
      );
    };

    return () => {
      if (engine) engine.onEffectActivated = undefined;
    };
  }, [engine, dispatch, gameState]);

  const startNewGame = useCallback(() => {
    const deck1 = allCards.map(cardFactory).sort(() => 0.5 - Math.random());
    const deck2 = loadAIDeck();

    // Wrap trap callback in a function that uses the ref
    const trapCallback = async (
      defenderIndex: 0 | 1,
      attackerLane: number,
      targetLane: number,
    ): Promise<boolean> => {
      if (trapActivationCallbackRef.current) {
        return trapActivationCallbackRef.current(
          defenderIndex,
          attackerLane,
          targetLane,
        );
      }
      return false;
    };

    // Wrap AI attack animation callback in a function that uses the ref
    const aiAttackCallback = async (
      attackerLane: number,
      targetLane: number | null,
    ): Promise<void> => {
      if (aiAttackAnimationCallbackRef.current) {
        return aiAttackAnimationCallbackRef.current(attackerLane, targetLane);
      }
    };

    initializeGame(deck1, deck2, aiSkillLevel, trapCallback, aiAttackCallback);
    dispatch(setSelectedHandCard(null));
    dispatch(setSelectedAttacker(null));
  }, [initializeGame, aiSkillLevel, dispatch]);

  const startNewGameWithCustomDeck = useCallback(() => {
    const customDeck = loadDeckFromLocalStorage();

    if (customDeck && customDeck.length < 20) {
      alert(
        `Your saved deck has ${customDeck.length} cards. You need exactly 20 cards to use it. Please update your deck in the Deck Builder.`,
      );
      startNewGame();
      return;
    }

    const deck1 =
      customDeck && customDeck.length >= 20
        ? [...customDeck].sort(() => 0.5 - Math.random())
        : allCards.map(cardFactory).sort(() => 0.5 - Math.random());
    const deck2 = loadAIDeck();

    // Wrap trap callback in a function that uses the ref
    const trapCallback = async (
      defenderIndex: 0 | 1,
      attackerLane: number,
      targetLane: number,
    ): Promise<boolean> => {
      if (trapActivationCallbackRef.current) {
        return trapActivationCallbackRef.current(
          defenderIndex,
          attackerLane,
          targetLane,
        );
      }
      return false;
    };

    // Wrap AI attack animation callback in a function that uses the ref
    const aiAttackCallback = async (
      attackerLane: number,
      targetLane: number | null,
    ): Promise<void> => {
      if (aiAttackAnimationCallbackRef.current) {
        return aiAttackAnimationCallbackRef.current(attackerLane, targetLane);
      }
    };

    initializeGame(deck1, deck2, aiSkillLevel, trapCallback, aiAttackCallback);
    dispatch(setSelectedHandCard(null));
    dispatch(setSelectedAttacker(null));
  }, [initializeGame, aiSkillLevel, dispatch, startNewGame]);

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
      }),
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
    mode: "ATTACK" | "DEFENSE" = "ATTACK",
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
        mode,
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
        }),
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
    if (
      card?.type === CardType.Support ||
      card?.type === CardType.Action ||
      card?.type === CardType.Trap
    ) {
      const success = playSupport(
        0, // Player 1 only
        slot,
        selectedHandCard,
      );
      if (success) {
        dispatch(setSelectedHandCard(null));
      }
    }
  };

  const handleActivateSupport = (slot: number, element?: HTMLElement) => {
    if (isShowingEffectNotification) return;
    if (checkNeedsToDraw()) {
      showDrawReminderModal();
      return;
    }
    const card = player1.support[slot];
    if (!card || card.isActive) return;

    // Check if card is face down - must flip and activate
    if (card.isFaceDown) {
      // Check if this is a TRAP card type - cannot be manually activated
      if (card.type === CardType.Trap) {
        dispatch(
          openModal({
            title: "Cannot Activate",
            message: `${card.name} is a Trap card and can only be activated when its trigger condition is met.`,
            onConfirm: () => {
              dispatch(closeModal());
            },
          }),
        );
        return;
      }

      // Check if this card has a reactive trigger - cannot be manually activated
      // Allow: ON_PLAY, CONTINUOUS (manually activatable)
      // Block: ON_DEFEND, ON_ATTACK, ON_DESTROY, ON_DRAW (reactive triggers)
      if (card.effectId) {
        const effectDef = effectsRegistry[card.effectId];
        const reactiveTriggers = [
          "ON_DEFEND",
          "ON_ATTACK",
          "ON_DESTROY",
          "ON_DRAW",
        ];
        if (
          effectDef &&
          effectDef.trigger &&
          reactiveTriggers.includes(effectDef.trigger)
        ) {
          dispatch(
            openModal({
              title: "Cannot Activate",
              message: `${card.name} can only be activated when its trigger condition is met (${effectDef.trigger}).`,
              onConfirm: () => {
                dispatch(closeModal());
              },
            }),
          );
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
            }),
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
                engine.activateSupport(0 as 0 | 1, slot); // removes the card from play - may want to revisit this later
                refresh();
                dispatch(closeModal());
              },
            }),
          );
          return;
        }

        // First show confirmation modal, then target selection
        dispatch(
          openModal({
            title: "Activate Card",
            message: `Flip ${card.name} face-up and activate it?`,
            onConfirm: () => {
              dispatch(closeModal());
              // After confirmation, open target selection modal
              dispatch(
                openTargetSelectModal({
                  title: metadata?.targeting?.description || "Select target",
                  message: `Choose a target for ${card.name}`,
                  options,
                  onConfirm: (targetValue: number) => {
                    // Determine what the target value represents based on effect type
                    const eventData: any = {};

                    if (
                      metadata?.targeting?.targetType === "OPPONENT_SUPPORT"
                    ) {
                      eventData.targetPlayer = 1;
                      eventData.targetLane = targetValue;
                    } else if (
                      metadata?.targeting?.targetType?.includes("CREATURE")
                    ) {
                      eventData.targetLane = targetValue;
                      eventData.lane = targetValue; // Also set lane for effect handler
                    }

                    // Queue animation first if element is provided
                    if (element) {
                      queueActivation(card, element, () => {
                        // Execute activation after animation completes
                        engine.activateSupport(0 as 0 | 1, slot, eventData);
                        refresh();
                      });
                    } else {
                      // No animation - activate immediately
                      engine.activateSupport(0 as 0 | 1, slot, eventData);
                      refresh();
                    }
                  },
                }),
              );
            },
          }),
        );
        return;
      }

      // Standard activation (no targeting required)
      dispatch(
        openModal({
          title: "Activate Card",
          message: `Flip ${card.name} face-up and activate it?`,
          onConfirm: () => {
            // Queue animation first if element is provided
            if (element) {
              queueActivation(card, element, () => {
                // Execute activation after animation completes
                activateSupport(0, slot);
              });
            } else {
              // No animation - activate immediately
              activateSupport(0, slot);
            }
            dispatch(closeModal());
          },
        }),
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

  const handleAttack = (targetLane: number, defenderElement?: HTMLElement) => {
    if (isShowingEffectNotification) return;
    if (selectedAttacker === null) return;

    // Determine defender index
    const defenderIndex = gameState.activePlayer === 0 ? 1 : 0;

    const executeAttack = () => {
      // Only animate if it's the human player's turn (player 0) and we have both elements
      if (
        gameState.activePlayer === 0 &&
        attackerRef.current &&
        defenderElement
      ) {
        const attackerCard = player1.lanes[selectedAttacker];
        const defenderCard =
          targetLane !== null ? player2.lanes[targetLane] : null;

        if (attackerCard) {
          // Get effective stats with momentum buffs
          const attackerStats = getEffectiveCreatureStats(
            attackerCard,
            player1.momentum,
          );

          // Calculate damage that will be dealt to defender
          let damageToDefender = 0;
          let damageToAttacker = 0; // Counter damage
          if (defenderCard) {
            const defenderStats = getEffectiveCreatureStats(
              defenderCard,
              player2.momentum,
            );

            // Combat damage calculation
            if (
              attackerCard.mode === "ATTACK" &&
              defenderCard.mode === "ATTACK"
            ) {
              // ATTACK vs ATTACK: both deal damage, calculate net counter damage
              damageToDefender = attackerStats.atk;
              // Counter damage is defender's ATK minus attacker's DEF
              damageToAttacker = Math.max(
                0,
                defenderStats.atk - attackerStats.def,
              );
            } else if (
              attackerCard.mode === "ATTACK" &&
              defenderCard.mode === "DEFENSE"
            ) {
              // ATTACK vs DEFENSE: only attacker deals damage (ATK - DEF)
              damageToDefender = Math.max(
                0,
                attackerStats.atk - defenderStats.def,
              );
              damageToAttacker = 0;
            }
          } else {
            // Direct attack
            damageToDefender = attackerStats.atk;
            damageToAttacker = 0;
          }

          // Store refs for animation then clear immediately to prevent re-triggers
          const attackerElement = attackerRef.current;
          attackerRef.current = null; // Clear immediately!

          // Queue attack animation with callback to execute attack after animation
          queueAttack(
            attackerCard,
            attackerElement,
            defenderElement,
            damageToDefender,
            damageToAttacker,
            () => {
              attack(gameState.activePlayer, selectedAttacker, targetLane);
              dispatch(setSelectedAttacker(null));
            },
          );
          return;
        }
      }
      // No animation - execute attack immediately
      // Clear refs
      attackerRef.current = null;
      attack(gameState.activePlayer, selectedAttacker, targetLane);
      dispatch(setSelectedAttacker(null));
    };

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
            dispatch(closeModal());
            // Proceed with the attack after trap resolution
            executeAttack();
          },
          onCancel: () => {
            dispatch(closeModal());
            // Don't activate trap, just proceed with attack
            executeAttack();
          },
        }),
      );
      return;
    }

    // No trap prompt needed — proceed with attack
    executeAttack();
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
      }),
    );
  };

  const handleCreatureDoubleClick = (lane: number, playerIndex: 0 | 1) => {
    const player = gameState.players[playerIndex];
    const card = player.lanes[lane];
    if (!card) return;

    // Get active effects that affect this card
    const cardEffects = gameState.activeEffects.filter((effect) =>
      effect.affectedCardIds?.includes(card.id),
    );

    dispatch(
      openCardDetailModal({
        card,
        activeEffects: cardEffects,
      }),
    );
  };

  const handleSupportDoubleClick = (slot: number, playerIndex: 0 | 1) => {
    const player = gameState.players[playerIndex];
    const card = player.support[slot];
    if (!card) return;

    // Get active effects that affect this card
    const cardEffects = gameState.activeEffects.filter((effect) =>
      effect.affectedCardIds?.includes(card.id),
    );

    dispatch(
      openCardDetailModal({
        card,
        activeEffects: cardEffects,
      }),
    );
  };

  const handleHandCardDoubleClick = (card: CardInterface) => {
    // Hand cards don't have active effects on them yet
    dispatch(
      openCardDetailModal({
        card,
        activeEffects: [],
      }),
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
        <ActiveEffects
          activeEffects={gameState.activeEffects}
          players={gameState.players}
        />
        <PlayerBoard
          player={player2}
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
          onSetAttackerRef={(element) => {
            attackerRef.current = element;
          }}
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
          onSetAttackerRef={(element) => {
            attackerRef.current = element;
          }}
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
                  card.type === CardType.Support ||
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
            isAttacking={true}
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
}
