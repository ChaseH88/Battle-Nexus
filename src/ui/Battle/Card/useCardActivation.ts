import { useState, useCallback } from "react";
import { CardInterface } from "@cards/types";

export const useCardActivation = () => {
  const [activatingCard, setActivatingCard] = useState<CardInterface | null>(
    null
  );
  const [isActivating, setIsActivating] = useState(false);
  const [originBounds, setOriginBounds] = useState<DOMRect | undefined>();

  const activateCard = useCallback(
    (card: CardInterface, element: HTMLElement) => {
      const bounds = element.getBoundingClientRect();
      setOriginBounds(bounds);
      setActivatingCard(card);
      setIsActivating(true);
    },
    []
  );

  const handleComplete = useCallback(() => {
    setIsActivating(false);
    setActivatingCard(null);
    setOriginBounds(undefined);
  }, []);

  return {
    activatingCard,
    isActivating,
    originBounds,
    activateCard,
    handleComplete,
  };
};
