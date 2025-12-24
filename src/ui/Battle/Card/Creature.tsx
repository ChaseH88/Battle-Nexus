import { CreatureCard } from "@cards/CreatureCard";
import fireAffinity from "@assets/affinity/fire.png";
import waterAffinity from "@assets/affinity/water.png";
import grassAffinity from "@assets/affinity/grass.png";
import lightningAffinity from "@assets/affinity/lightning.png";
import iceAffinity from "@assets/affinity/ice.png";
import windAffinity from "@assets/affinity/wind.png";
import metalAffinity from "@assets/affinity/metal.png";
import lightAffinity from "@assets/affinity/light.png";
import shadowAffinity from "@assets/affinity/shadow.png";
import psychicAffinity from "@assets/affinity/psychic.png";

import { Affinity } from "@cards";
import { useCallback } from "react";
import { Cost } from "./Common/Cost";

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
    | "cost"
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
  cost,
}: CreatureProps) => {
  const getAffinityIcon = useCallback(
    (affinity: Affinity) => {
      switch (affinity) {
        case "FIRE":
          return fireAffinity;
        case "WATER":
          return waterAffinity;
        case "GRASS":
          return grassAffinity;
        case "LIGHTNING":
          return lightningAffinity;
        case "ICE":
          return iceAffinity;
        case "WIND":
          return windAffinity;
        case "METAL":
          return metalAffinity;
        case "LIGHT":
          return lightAffinity;
        case "SHADOW":
          return shadowAffinity;
        case "PSYCHIC":
          return psychicAffinity;
        default:
          return "#";
      }
    },
    [affinity]
  );

  return (
    <article
      className="creature-card-details"
      style={{ width: 160, height: 253, fontSize: "11px", padding: "8px" }}
    >
      <div>
        <Cost cost={cost} affinity={affinity} />
        <div className="card-type" style={{ fontSize: "9px" }}>
          {type}
        </div>
        <div
          className="card-name"
          style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}
        >
          {name}
        </div>
        <div className="card-affinity">
          <img
            src={getAffinityIcon(affinity)}
            alt={affinity}
            style={{ width: "16px", height: "16px", verticalAlign: "middle" }}
            title={affinity}
          />{" "}
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
        <div
          className="attack"
          style={{ opacity: mode === "ATTACK" ? 1 : 0.5 }}
        >
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
};
