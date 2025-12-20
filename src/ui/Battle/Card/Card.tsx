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
  isSelected?: boolean;
  showFaceDown?: boolean;
  selectedHandCard?: string | null;
}

export const Card = ({
  card,
  onClick,
  isSelected,
  showFaceDown,
  selectedHandCard,
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

  // Show support/action face-down if showFaceDown prop is true AND card is not active
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
      }`}
      onClick={onClick}
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
        />
      )}
      {support && (
        <Support
          name={support.name}
          type={support.type}
          description={support.description}
          cost={support.cost}
          isActive={support.isActive}
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
        />
      )}
    </div>
  );
};
