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
import { useCallback, useMemo } from "react";
import { Cost } from "./Common/Cost";
import { CardImage } from "./CardImage";
import { Box, Typography } from "@mui/material";
import { Stats } from "./Common/Stats";
import { theme } from "@/ui/theme";
import { getMomentumGlobalBuff } from "@/battle/MomentumPressure";

interface CreatureProps extends Pick<
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
> {
  showCardMode?: boolean;
  playerMomentum?: number; // Player's current momentum for Momentum Pressure buffs
}

export const Creature = ({
  id,
  mode,
  // isAtkModified,
  // isDefModified,
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
  // type,
  cost,
  image,
  showCardMode = false,
  playerMomentum,
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

  const stats = useMemo(() => {
    const buff = getMomentumGlobalBuff(playerMomentum || 0);
    return {
      atk: Math.max(0, atk + buff.atk),
      def: Math.max(0, def + buff.def),
      maxHp: hp,
      currentHp: currentHp,
    };
  }, [atk, def, hp, currentHp, playerMomentum]);

  console.log("Creature Stats with Momentum Pressures:", stats);

  return (
    <Box
      component="article"
      className="creature-card-details"
      sx={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        position: "relative",
        backgroundColor: theme.palette.common.black,
      }}
      p={0}
    >
      <Box display="flex" alignItems="center">
        <Box flex="0 0 40px">
          <Cost
            cost={cost}
            affinity={affinity}
            sx={{
              position: "relative",
              left: "6px",
              bottom: "1px",
            }}
          />
        </Box>
        <Box
          className="card-text-header"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
        >
          <Box
            className="card-name"
            style={{
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            <Typography variant="h6" noWrap fontSize={13} m={0}>
              {name}
            </Typography>
          </Box>
          <Box className="card-id" style={{ fontSize: "8px" }}>
            <Typography variant="h6" noWrap fontSize={10} m={0}>
              {`CREATURE - ${affinity.toUpperCase()}`}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Cost
            affinity={affinity}
            showInnerRing={false}
            cost={
              <img
                src={getAffinityIcon(affinity)}
                alt={affinity}
                style={{
                  width: "11px",
                  height: "11px",
                  verticalAlign: "middle",
                }}
                title={affinity}
              />
            }
            size={16}
            sx={{
              position: "relative",
              right: "4px",
            }}
          />
        </Box>
      </Box>
      {showCardMode && (
        <Box
          className="card-mode-badge"
          style={{ fontSize: "10px", fontWeight: "bold" }}
        >
          {mode === "ATTACK" ? "⚔️ ATTACK" : "🛡️ DEFENSE"}
        </Box>
      )}
      <Box height="190px" marginBottom="4px">
        <CardImage card={{ id, name, image }} width={175} height={162} />
      </Box>
      <Box
        className="card-description"
        style={{
          fontSize: "9px",
          marginBottom: "4px",
          lineHeight: "1.2",
          position: "relative",
          bottom: 32,
        }}
      >
        <Typography
          variant="body2"
          mx={1.5}
          color="#fff"
          fontSize={9}
          textAlign="left"
        >
          {description}
        </Typography>
      </Box>
      <Stats
        affinity={affinity}
        atk={stats.atk}
        def={stats.def}
        hp={stats.maxHp}
        currentHp={stats.currentHp}
        isAtkModified={stats.atk !== atk}
        isDefModified={stats.def !== def}
        width={187}
        height={28}
        sx={{
          position: "absolute",
          bottom: "0px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 3,
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
      <Box className="hp-bar">
        <Box
          sx={{
            position: "absolute",
            bottom: 28,
            left: 0,
            width: `${(stats.currentHp / stats.maxHp) * 100}%`,
            height: "4px",
            backgroundColor:
              stats.currentHp / stats.maxHp > 0.5
                ? "#00ff51ff"
                : stats.currentHp / stats.maxHp > 0.2
                  ? "#ffae00ff"
                  : "#ff0000ff",
            transition: "width 0.3s ease-in-out",
            zIndex: 4,
          }}
        />
      </Box>
    </Box>
  );
};
