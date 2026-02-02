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
import { CARD_DIMENSIONS } from "./cardDimensions";

interface CreatureProps {
  id: string;
  mode: "ATTACK" | "DEFENSE";
  hp: number;
  currentHp?: number;
  hasAttackedThisTurn: boolean;
  description: string;
  affinity: Affinity;
  name: string;
  cost: number;
  image?: string;
  showCardMode?: boolean;
  effectiveAtk: number; // Effective ATK after all buffs
  effectiveDef: number; // Effective DEF after all buffs
  baseAtk: number; // Base ATK for comparison
  baseDef: number; // Base DEF for comparison
}

export const Creature = ({
  id,
  mode,
  hp,
  currentHp,
  hasAttackedThisTurn,
  description,
  affinity,
  name,
  cost,
  image,
  showCardMode = false,
  effectiveAtk,
  effectiveDef,
  baseAtk,
  baseDef,
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
    console.log("Creature Stats Calculation:", {
      id,
      name,
      baseAtk,
      baseDef,
      effectiveAtk,
      effectiveDef,
      atkBuff: effectiveAtk - baseAtk,
      defBuff: effectiveDef - baseDef,
    });

    return {
      atk: effectiveAtk,
      def: effectiveDef,
      baseAtk,
      baseDef,
      maxHp: hp,
      currentHp: currentHp ?? hp,
    };
  }, [baseAtk, baseDef, hp, currentHp, effectiveAtk, effectiveDef, id, name]);

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
            <Typography
              variant="h6"
              noWrap
              fontSize={10}
              m={0}
              lineHeight={0.8}
            >
              {name}
            </Typography>
          </Box>
          <Box className="card-id">
            <Typography variant="h6" noWrap fontSize={7} m={0}>
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
      <Box height={CARD_DIMENSIONS.HEIGHT} marginBottom="4px">
        <CardImage card={{ id, name, image }} />
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
        baseAtk={stats.baseAtk}
        def={stats.def}
        baseDef={stats.baseDef}
        hp={stats.maxHp}
        currentHp={stats.currentHp}
        isAtkModified={stats.atk !== stats.baseAtk}
        isDefModified={stats.def !== stats.baseDef}
        width={CARD_DIMENSIONS.WIDTH - 2}
        height={30}
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
