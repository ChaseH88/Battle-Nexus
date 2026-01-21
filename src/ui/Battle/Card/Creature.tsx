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
import { CardImage } from "./CardImage";
import { Box } from "@mui/material";
import { Stats } from "./Common/Stats";
import { DescriptionStatsBackground } from "./Common/DescriptionStatsBackground";

type CreatureProps = Pick<
  CreatureCard,
  | "id"
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
  | "image"
>;

export const Creature = ({
  id,
  mode,
  isAtkModified,
  isDefModified,
  atk,
  def,
  // baseAtk,
  // baseDef,
  hp,
  currentHp,
  hasAttackedThisTurn,
  description,
  affinity,
  name,
  type,
  cost,
  image,
}: CreatureProps) => {
  const getAffinityIcon = useCallback((affinity: Affinity) => {
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
  }, []);

  return (
    <Box
      component="article"
      className="creature-card-details"
      sx={{
        width: "100%",
        height: "100%",
        fontSize: "11px",
        padding: "8px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <Box>
        <Cost cost={cost} affinity={affinity} />
        <Box className="card-type" style={{ fontSize: "9px" }}>
          {cost === 5 ? `MAX ${type.toUpperCase()}` : type}
        </Box>
        <Box
          className="card-name"
          style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}
        >
          {name}
        </Box>
        <Box className="card-affinity">
          <img
            src={getAffinityIcon(affinity)}
            alt={affinity}
            style={{ width: "16px", height: "16px", verticalAlign: "middle" }}
            title={affinity}
          />{" "}
        </Box>
      </Box>
      <Box
        className="card-mode-badge"
        style={{ fontSize: "10px", fontWeight: "bold" }}
      >
        {mode === "ATTACK" ? "⚔️ ATTACK" : "🛡️ DEFENSE"}
      </Box>
      <CardImage card={{ id, name, image }} width={80} height={80} />
      <Box
        className="card-description"
        style={{ fontSize: "9px", marginBottom: "4px", lineHeight: "1.2" }}
      >
        {description}
      </Box>
      <DescriptionStatsBackground
        affinity={affinity}
        width={189}
        height={95}
        sx={{
          position: "absolute",
          bottom: "0",
          left: "50%",
          transformOrigin: "top center",
          transform: "translateX(-50%) translateY(14%)",
          zIndex: -1,
        }}
      />
      <Stats
        affinity={affinity}
        atk={atk}
        def={def}
        hp={hp}
        currentHp={currentHp}
        isAtkModified={isAtkModified}
        isDefModified={isDefModified}
        width={183}
        height={25}
        sx={{
          position: "absolute",
          bottom: "0px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      {hasAttackedThisTurn && (
        <Box
          className="attacked-badge"
          style={{ fontSize: "9px", padding: "2px 4px" }}
        >
          ATTACKED
        </Box>
      )}
    </Box>
  );
};
