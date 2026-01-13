import { useState, useCallback } from "react";
import { CardInterface } from "@cards/types";

export const useCardAttack = () => {
  const [attackingCard, setAttackingCard] = useState<CardInterface | null>(
    null
  );
  const [isAttacking, setIsAttacking] = useState(false);
  const [attackerBounds, setAttackerBounds] = useState<DOMRect | undefined>();
  const [defenderBounds, setDefenderBounds] = useState<DOMRect | undefined>();

  const attackCard = useCallback(
    (
      card: CardInterface,
      attackerElement: HTMLElement,
      defenderElement: HTMLElement
    ) => {
      const attackerRect = attackerElement.getBoundingClientRect();
      const defenderRect = defenderElement.getBoundingClientRect();
      setAttackerBounds(attackerRect);
      setDefenderBounds(defenderRect);
      setAttackingCard(card);
      setIsAttacking(true);
    },
    []
  );

  const handleAttackComplete = useCallback(() => {
    setIsAttacking(false);
    setAttackingCard(null);
    setAttackerBounds(undefined);
    setDefenderBounds(undefined);
  }, []);

  return {
    attackingCard,
    isAttacking,
    attackerBounds,
    defenderBounds,
    attackCard,
    handleAttackComplete,
  };
};
