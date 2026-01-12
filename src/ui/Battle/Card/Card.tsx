import { CardInterface, CardType } from "../../../cards/types";
import { Creature } from "./Creature";
import { Support } from "./Support";
import { Action } from "./Action";
import { SupportCard } from "../../../cards/SupportCard";
import { ActionCard } from "../../../cards/ActionCard";
import { TrapCard } from "../../../cards/TrapCard";
import { Back } from "./Back";
import { CreatureCard } from "../../../cards";
import { CardSlot } from "./Card.styles";

interface CardProps {
  card: CardInterface | null;
  onClick?: () => void;
  onDoubleClick?: () => void;
  isSelected?: boolean;
  showFaceDown?: boolean;
  selectedHandCard?: string | null;
  canActivate?: boolean; // New prop to show pulsing border
  disableHover?: boolean; // Disable hover animations (for modal display)
}

export const Card = ({
  card,
  onClick,
  onDoubleClick,
  isSelected,
  showFaceDown,
  selectedHandCard,
  canActivate = false,
  disableHover = false,
}: CardProps) => {
  if (!card) {
    return <CardSlot isEmpty onClick={onClick} />;
  }

  const isCreature = card.type === CardType.Creature;
  const isSupport = card.type === CardType.Support;
  const isAction = card.type === CardType.Action;
  const isTrap = card.type === CardType.Trap;
  const creature = isCreature ? (card as CreatureCard) : null;
  const support = isSupport ? (card as SupportCard) : null;
  const action = isAction ? (card as ActionCard) : null;
  const trap = isTrap ? (card as TrapCard) : null;

  // Show creature face-down if it has isFaceDown property set
  if (creature && creature.isFaceDown) {
    return <Back onClick={onClick} type="creature" />;
  }

  // Show support/action/trap face-down if isFaceDown is true
  if (
    (support && support.isFaceDown) ||
    (action && action.isFaceDown) ||
    (trap && trap.isFaceDown)
  ) {
    const backType = support ? "support" : action ? "action" : "trap";
    return <Back onClick={onClick} type={backType} />;
  }

  // Also show face-down for opponent's inactive cards if showFaceDown is true
  if (
    showFaceDown &&
    (support || action || trap) &&
    !(support || action || trap)!.isActive
  ) {
    const backType = support ? "support" : action ? "action" : "trap";
    return <Back onClick={onClick} type={backType} />;
  }

  const isDefeated = creature ? creature.currentHp <= 0 : false;
  const isExhausted = creature ? creature.hasAttackedThisTurn : false;
  const isDefenseMode = creature ? creature.mode === "DEFENSE" : false;
  const isActiveCard = Boolean(
    (support && support.isActive) ||
      (action && action.isActive) ||
      (trap && trap.isActive)
  );

  return (
    <CardSlot
      cardType={card.type}
      isSelected={selectedHandCard === card.id || isSelected}
      isDefeated={isDefeated}
      isExhausted={isExhausted}
      isDefenseMode={isDefenseMode}
      isFaceDown={false}
      isActive={isActiveCard}
      canActivate={canActivate}
      disableHover={disableHover}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {creature && (
        <Creature
          mode={creature.mode}
          isAtkModified={creature.isAtkModified}
          isDefModified={creature.isDefModified}
          atk={creature.atk}
          def={creature.def}
          baseAtk={creature.baseAtk}
          baseDef={creature.baseDef}
          hp={creature.hp}
          currentHp={creature.currentHp}
          hasAttackedThisTurn={creature.hasAttackedThisTurn}
          description={creature.description}
          affinity={creature.affinity}
          name={creature.name}
          type={creature.type}
          cost={creature.cost}
        />
      )}
      {support && (
        <Support
          name={support.name}
          type={support.type}
          description={support.description}
          cost={support.cost}
          isActive={support.isActive}
          isFaceDown={support.isFaceDown}
          targetPlayerIndex={support.targetPlayerIndex}
        />
      )}
      {action && (
        <Action
          name={action.name}
          type={action.type}
          description={action.description}
          cost={action.cost}
          speed={action.speed}
          isActive={action.isActive}
          isFaceDown={action.isFaceDown}
        />
      )}
      {trap && (
        <Support
          name={trap.name}
          type={trap.type}
          description={trap.description}
          cost={trap.cost}
          isActive={trap.isActive}
          isFaceDown={trap.isFaceDown}
        />
      )}
    </CardSlot>
  );
};
