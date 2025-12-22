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
    | "affinity"
    | "name"
    | "type"
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
  affinity,
  name,
  type,
}: CreatureProps) => (
  <article
    className="creature-card-details"
    style={{ width: 160, height: 253, fontSize: "11px", padding: "8px" }}
  >
    <div>
      <div className="card-type" style={{ fontSize: "9px" }}>
        {type}
      </div>
      <div
        className="card-name"
        style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}
      >
        {name}
      </div>
      <div className="card-affinity" style={{ fontSize: "10px" }}>
        {affinity}
      </div>
    </div>
    <div
      className="card-mode-badge"
      style={{ fontSize: "10px", fontWeight: "bold" }}
    >
      {mode === "ATTACK" ? "⚔️ ATTACK" : "🛡️ DEFENSE"}
    </div>
    <div
      style={{
        height: 80,
        width: 80,
        background: "white",
        margin: "4px auto",
      }}
    />
    <div
      className="card-description"
      style={{ fontSize: "9px", marginBottom: "4px", lineHeight: "1.2" }}
    >
      {description}
    </div>
    <div
      className="card-stats"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        fontSize: "10px",
      }}
    >
      <div
        className="card-hp"
        style={{
          fontWeight: "bold",
          color: currentHp < hp * 0.3 ? "#ef4444" : "#22c55e",
        }}
      >
        <span className="hp-label">❤️ HP:</span>
        <span className={`hp-value ${currentHp < hp * 0.3 ? "low" : ""}`}>
          {currentHp}/{hp}
        </span>
      </div>
      <div className="attack" style={{ opacity: mode === "ATTACK" ? 1 : 0.5 }}>
        <span className={`atk ${isAtkModified ? "modified" : ""}`}>
          ⚔️ ATK: {atk}
          {isAtkModified && <span className="base-stat">({baseAtk})</span>}
          {isAtkModified && (
            <span className="stat-icon" title="Modified">
              ⚡
            </span>
          )}
        </span>
      </div>
      <div
        className="defense"
        style={{ opacity: mode === "DEFENSE" ? 1 : 0.5 }}
      >
        <span className={`def ${isDefModified ? "modified" : ""}`}>
          🛡️ DEF: {def}
          {isDefModified && <span className="base-stat">({baseDef})</span>}
          {isDefModified && (
            <span className="stat-icon" title="Modified">
              ⚡
            </span>
          )}
        </span>
      </div>
    </div>
    {hasAttackedThisTurn && (
      <div
        className="attacked-badge"
        style={{ fontSize: "9px", padding: "2px 4px" }}
      >
        ATTACKED
      </div>
    )}
  </article>
);
