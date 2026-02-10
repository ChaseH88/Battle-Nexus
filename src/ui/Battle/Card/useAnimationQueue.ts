import { useState, useCallback, useRef, useEffect } from "react";
import { CardInterface } from "@cards/types";

type AnimationType = "activation" | "attack" | "draw";

interface AnimationQueueItem {
  id: string;
  type: AnimationType;
  blocking: boolean; // true = blocks interactions, false = doesn't block
  data: {
    card?: CardInterface;
    originBounds?: DOMRect;
    attackerBounds?: DOMRect;
    defenderBounds?: DOMRect;
    startBounds?: DOMRect; // For draw animation
    damage?: number; // Damage dealt to defender
    counterDamage?: number; // Counter damage dealt to attacker
  };
  onComplete?: () => void;
}

interface UseAnimationQueueReturn {
  // Current animation state
  currentAnimation: AnimationQueueItem | null;
  activeAnimations: AnimationQueueItem[]; // Multiple non-blocking animations can play at once
  isAnimating: boolean; // Only true if blocking animation is playing

  // Queue management
  queueActivation: (
    card: CardInterface,
    element: HTMLElement,
    onComplete?: () => void,
  ) => void;
  queueAttack: (
    card: CardInterface,
    attackerElement: HTMLElement,
    defenderElement: HTMLElement,
    damage: number,
    counterDamage: number,
    onComplete?: () => void,
  ) => void;
  queueDraw: (deckElement: HTMLElement, onComplete?: () => void) => void;
  completeCurrentAnimation: () => void;
  completeAnimation: (animationId: string) => void;
  clearQueue: () => void;
}

/**
 * Animation queue hook to ensure animations play sequentially without overlapping
 */
export const useAnimationQueue = (): UseAnimationQueueReturn => {
  const [queue, setQueue] = useState<AnimationQueueItem[]>([]);
  const [currentAnimation, setCurrentAnimation] =
    useState<AnimationQueueItem | null>(null);
  const [activeAnimations, setActiveAnimations] = useState<
    AnimationQueueItem[]
  >([]);
  const processingRef = useRef(false);

  // Queue an activation animation (blocking)
  const queueActivation = useCallback(
    (card: CardInterface, element: HTMLElement, onComplete?: () => void) => {
      const bounds = element.getBoundingClientRect();
      const item: AnimationQueueItem = {
        id: `activation-${Date.now()}-${Math.random()}`,
        type: "activation",
        blocking: true, // Activation animations block interactions
        data: {
          card,
          originBounds: bounds,
        },
        onComplete,
      };

      setQueue((prev) => [...prev, item]);
    },
    [],
  );

  // Queue an attack animation (blocking)
  const queueAttack = useCallback(
    (
      card: CardInterface,
      attackerElement: HTMLElement,
      defenderElement: HTMLElement,
      damage: number,
      counterDamage: number,
      onComplete?: () => void,
    ) => {
      const attackerBounds = attackerElement.getBoundingClientRect();
      const defenderBounds = defenderElement.getBoundingClientRect();

      const item: AnimationQueueItem = {
        id: `attack-${Date.now()}-${Math.random()}`,
        type: "attack",
        blocking: true, // Attack animations block interactions
        data: {
          card,
          attackerBounds,
          defenderBounds,
          damage,
          counterDamage,
        },
        onComplete,
      };

      setQueue((prev) => [...prev, item]);
    },
    [],
  );

  // Queue a draw animation (non-blocking - starts immediately)
  const queueDraw = useCallback(
    (deckElement: HTMLElement, onComplete?: () => void) => {
      const startBounds = deckElement.getBoundingClientRect();

      const item: AnimationQueueItem = {
        id: `draw-${Date.now()}-${Math.random()}`,
        type: "draw",
        blocking: false, // Draw animations don't block interactions
        data: {
          startBounds,
        },
        onComplete,
      };

      // Non-blocking animations start immediately
      setActiveAnimations((prev) => [...prev, item]);
    },
    [],
  );

  // Complete a specific animation by id (used for non-blocking animations)
  const completeAnimation = useCallback((animationId: string) => {
    setActiveAnimations((prev) => {
      const animation = prev.find((a) => a.id === animationId);
      if (animation?.onComplete) {
        animation.onComplete();
      }
      return prev.filter((a) => a.id !== animationId);
    });
  }, []);

  // Complete current blocking animation and move to next
  const completeCurrentAnimation = useCallback(() => {
    // Call the completion callback for the current animation
    if (currentAnimation?.onComplete) {
      currentAnimation.onComplete();
    }

    // Move to next animation in queue
    setQueue((prevQueue) => {
      if (prevQueue.length === 0) {
        // Queue is empty, just clear current animation
        setCurrentAnimation(null);
        processingRef.current = false;
        return prevQueue;
      }

      // Dequeue next item and set it as current
      const [nextItem, ...remaining] = prevQueue;
      setCurrentAnimation(nextItem);
      processingRef.current = true;
      return remaining;
    });
  }, [currentAnimation]);

  // Clear the entire queue and all active animations
  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentAnimation(null);
    setActiveAnimations([]);
    processingRef.current = false;
  }, []);

  // Start first animation when queue goes from empty to having items
  useEffect(() => {
    if (currentAnimation !== null) return; // Animation already in progress
    if (processingRef.current) return; // Already processing
    if (queue.length === 0) return; // Queue empty

    // Start the first animation
    setQueue((prevQueue) => {
      if (prevQueue.length === 0) return prevQueue;

      const [nextItem, ...remaining] = prevQueue;
      setCurrentAnimation(nextItem);
      processingRef.current = true;
      return remaining;
    });
  }, [queue.length, currentAnimation]); // Only depend on queue.length, not queue array

  return {
    currentAnimation,
    activeAnimations,
    isAnimating: currentAnimation !== null && currentAnimation.blocking, // Only blocking animations prevent interactions
    queueActivation,
    queueAttack,
    queueDraw,
    completeCurrentAnimation,
    completeAnimation,
    clearQueue,
  };
};
