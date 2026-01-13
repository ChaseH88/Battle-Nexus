import { useState, useCallback, useRef, useEffect } from "react";
import { CardInterface } from "@cards/types";

type AnimationType = "activation" | "attack";

interface AnimationQueueItem {
  id: string;
  type: AnimationType;
  data: {
    card: CardInterface;
    originBounds?: DOMRect;
    attackerBounds?: DOMRect;
    defenderBounds?: DOMRect;
  };
  onComplete?: () => void;
}

interface UseAnimationQueueReturn {
  // Current animation state
  currentAnimation: AnimationQueueItem | null;
  isAnimating: boolean;

  // Queue management
  queueActivation: (
    card: CardInterface,
    element: HTMLElement,
    onComplete?: () => void
  ) => void;
  queueAttack: (
    card: CardInterface,
    attackerElement: HTMLElement,
    defenderElement: HTMLElement,
    onComplete?: () => void
  ) => void;
  completeCurrentAnimation: () => void;
  clearQueue: () => void;
}

/**
 * Animation queue hook to ensure animations play sequentially without overlapping
 */
export const useAnimationQueue = (): UseAnimationQueueReturn => {
  const [queue, setQueue] = useState<AnimationQueueItem[]>([]);
  const [currentAnimation, setCurrentAnimation] =
    useState<AnimationQueueItem | null>(null);
  const processingRef = useRef(false);

  // Queue an activation animation
  const queueActivation = useCallback(
    (card: CardInterface, element: HTMLElement, onComplete?: () => void) => {
      const bounds = element.getBoundingClientRect();
      const item: AnimationQueueItem = {
        id: `activation-${Date.now()}-${Math.random()}`,
        type: "activation",
        data: {
          card,
          originBounds: bounds,
        },
        onComplete,
      };

      setQueue((prev) => [...prev, item]);
    },
    []
  );

  // Queue an attack animation
  const queueAttack = useCallback(
    (
      card: CardInterface,
      attackerElement: HTMLElement,
      defenderElement: HTMLElement,
      onComplete?: () => void
    ) => {
      const attackerBounds = attackerElement.getBoundingClientRect();
      const defenderBounds = defenderElement.getBoundingClientRect();

      const item: AnimationQueueItem = {
        id: `attack-${Date.now()}-${Math.random()}`,
        type: "attack",
        data: {
          card,
          attackerBounds,
          defenderBounds,
        },
        onComplete,
      };

      setQueue((prev) => [...prev, item]);
    },
    []
  );

  // Complete current animation and move to next
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

  // Clear the entire queue
  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentAnimation(null);
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
    isAnimating: currentAnimation !== null,
    queueActivation,
    queueAttack,
    completeCurrentAnimation,
    clearQueue,
  };
};
