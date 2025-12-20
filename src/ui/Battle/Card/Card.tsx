import { CardInterface, CardType } from "../../../cards/types";
import { CreatureCard } from "../../../cards/CreatureCard";
import { SupportCard } from "../../../cards/SupportCard";
import { ActionCard } from "../../../cards/ActionCard";

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

  // Face-down creature card
  if (showFaceDown && creature && creature.isFaceDown) {
    return (
      <div
        className={`card-slot creature face-down ${
          creature.mode === "DEFENSE" ? "defense-mode" : ""
        }`}
        onClick={onClick}
      >
        <div className="card-name">???</div>
        <div className="card-type">FACE-DOWN</div>
        <div className="card-mode-badge">{creature.mode}</div>
      </div>
    );
  }

  // Face-down support or action card
  if (showFaceDown && (support || action) && !(support || action)!.isActive) {
    return (
      <div
        className={`card-slot ${card.type.toLowerCase()} face-down`}
        onClick={onClick}
      >
        <div className="card-name">???</div>
        <div className="card-type">FACE-DOWN</div>
      </div>
    );
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
      <div className="card-name">{card.name}</div>
      {creature && (
        <>
          <div className="card-mode-badge">{creature.mode}</div>
          <div className="card-stats">
            <span className={`atk ${creature.isAtkModified ? "modified" : ""}`}>
              ATK: {creature.atk}
              {creature.isAtkModified && (
                <span className="base-stat">({creature.baseAtk})</span>
              )}
            </span>
            <span className={`def ${creature.isDefModified ? "modified" : ""}`}>
              DEF: {creature.def}
              {creature.isDefModified && (
                <span className="base-stat">({creature.baseDef})</span>
              )}
            </span>
          </div>
          <div className="card-hp">
            <span className="hp-label">HP:</span>
            <span
              className={`hp-value ${
                creature.currentHp < creature.hp * 0.3 ? "low" : ""
              }`}
            >
              {creature.currentHp}/{creature.hp}
            </span>
          </div>
          {creature.hasAttackedThisTurn && (
            <div className="attacked-badge">ATTACKED</div>
          )}
        </>
      )}
      {(support || action) && (support || action)!.isActive && (
        <div className="active-badge">ACTIVE</div>
      )}
      <div className="card-description">{card.description}</div>
      <div className="card-type">{card.type}</div>
      {creature?.affinity && (
        <div className="card-affinity">{creature.affinity}</div>
      )}
    </div>
  );
};
