import { CreatureCard } from "../../../cards/CreatureCard";

interface CreatureProps
  extends Pick<
    CreatureCard,
    | "mode"
    | "isAtkModified"
    | "isDefModified"
    | "atk"
    | "def"
    | "baseAtk"
    | "baseDef"
    | "hp"
    | "currentHp"
    | "hasAttackedThisTurn"
    | "description"
  > {}

export const Creature = ({
  mode,
  isAtkModified,
  isDefModified,
  atk,
  def,
  baseAtk,
  baseDef,
  hp,
  currentHp,
  hasAttackedThisTurn,
  description,
}: CreatureProps) => (
  <article className="creature-card-details">
    <div className="card-mode-badge">{mode}</div>
    <div
      style={{
        height: 100,
        width: 100,
        background: "white",
        margin: "0 auto 10px",
      }}
    />
    <div className="card-description">{description}</div>
    <div className="card-stats">
      <div className="card-hp">
        <span className="hp-label">HP:</span>
        <span className={`hp-value ${currentHp < hp * 0.3 ? "low" : ""}`}>
          {currentHp}/{hp}
        </span>
      </div>
      <div className="attack">
        <span className={`atk ${isAtkModified ? "modified" : ""}`}>
          ATK: {atk}
          {isAtkModified && <span className="base-stat">({baseAtk})</span>}
        </span>
      </div>
      <div className="defense">
        <span className={`def ${isDefModified ? "modified" : ""}`}>
          DEF: {def}
          {isDefModified && <span className="base-stat">({baseDef})</span>}
        </span>
      </div>
    </div>
    {hasAttackedThisTurn && <div className="attacked-badge">ATTACKED</div>}
  </article>
);
