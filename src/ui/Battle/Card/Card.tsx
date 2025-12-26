import { CardInterface, CardType } from "../../../cards/types";
import { Creature } from "./Creature";
import { Support } from "./Support";
import { Action } from "./Action";
import { SupportCard } from "../../../cards/SupportCard";
import { ActionCard } from "../../../cards/ActionCard";
import { Back } from "./Back";
import { CreatureCard } from "../../../cards";

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
    return (
      <div className="card-slot empty" onClick={onClick}>
        Empty
      </div>
    );
  }

  const isCreature = card.type === CardType.Creature;
  const isSupport = card.type === CardType.Support;
  const isAction = card.type === CardType.Action;
  const creature = isCreature ? (card as CreatureCard) : null;
  const support = isSupport ? (card as SupportCard) : null;
  const action = isAction ? (card as ActionCard) : null;

  // Show creature face-down if it has isFaceDown property set
  if (creature && creature.isFaceDown) {
    return <Back onClick={onClick} type="creature" />;
  }

  // Show support/action face-down if isFaceDown is true
  if ((support && support.isFaceDown) || (action && action.isFaceDown)) {
    return <Back onClick={onClick} type={support ? "support" : "action"} />;
  }

  // Also show face-down for opponent's inactive cards if showFaceDown is true
  if (showFaceDown && (support || action) && !(support || action)!.isActive) {
    return <Back onClick={onClick} type={support ? "support" : "action"} />;
  }

  return (
    <div
      className={`card-slot ${card.type.toLowerCase()} ${
        selectedHandCard === card.id || isSelected ? "selected" : ""
      } ${creature && creature.currentHp <= 0 ? "defeated" : ""} ${
        creature && creature.hasAttackedThisTurn ? "exhausted" : ""
      } ${creature && creature.mode === "DEFENSE" ? "defense-mode" : ""} ${
        creature && creature.isFaceDown ? "face-down" : ""
      } ${
        (support || action) && (support || action)!.isActive ? "active" : ""
      } ${canActivate ? "can-activate" : ""} ${disableHover ? "no-hover" : ""}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{ width: 160, height: 253, display: "inline-block" }}
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
          targetLane={support.targetLane}
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
    </div>
  );
};
