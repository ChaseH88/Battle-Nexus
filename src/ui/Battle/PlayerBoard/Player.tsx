import { PlayerState } from "../../../battle/PlayerState";
import { motion } from "framer-motion";
import {
  PlayerContainer,
  PlayerContent,
  PlayerName,
  LifePointsContainer,
  LifePointsText,
  MomentumBarContainer,
  getMomentumBoxStyles,
  getMomentumBoxAnimation,
} from "./Player.styled";
import { Box } from "@mui/material";

interface PlayerProps {
  player: PlayerState;
  lifePoints: number;
  isOpponent?: boolean;
}

const MAX_MOMENTUM = 10;
const MOMENTUM_COLORS = [
  "#FFF200", // Electric Yellow
  "#FFE600", // Bright Yellow
  "#FFD100", // Yellow-Gold
  "#FFB700", // Amber Yellow
  "#FFC400", // High-Energy Yellow
  "#6FE3FF", // Electric Cyan
  "#3FCBFF", // Light Neon Blue
  "#1FA8FF", // Sky Electric Blue
  "#007CFF", // Pure Electric Blue
  "#0050FF", // Deep Power Blue
];

const EMPTY_BOX_COLOR = "#1f2937";
const FULL_MOMENTUM_COLOR = "#26ffea";
const MAX_LIFE_POINTS = 2000;

const getMomentumBoxColor = (
  index: number,
  currentMomentum: number
): string => {
  if (index >= currentMomentum) return EMPTY_BOX_COLOR;
  return MOMENTUM_COLORS[index] || EMPTY_BOX_COLOR;
};

const getLifePointsColor = (lifePoints: number): string => {
  if (lifePoints >= MAX_LIFE_POINTS) return "#00ff00"; // Lime green at full health
  if (lifePoints >= 1500) return "#32cd32"; // Darker bright green
  if (lifePoints >= 1000) return "#ffd700"; // Yellow
  return "#ff0000"; // Red
};

export const Player = ({
  player,
  lifePoints,
  isOpponent = false,
}: PlayerProps) => {
  const momentum = player.momentum;
  const isFull = momentum >= MAX_MOMENTUM;
  const lifePointsColor = getLifePointsColor(lifePoints);

  const boxes = Array.from({ length: MAX_MOMENTUM }, (_, i) =>
    getMomentumBoxColor(i, momentum)
  );

  return (
    <PlayerContainer isOpponent={isOpponent}>
      <PlayerContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <PlayerName>{player.id}</PlayerName>
          <LifePointsContainer>
            <LifePointsText
              lifePointsColor={lifePointsColor}
              data-testid={
                isOpponent ? "opponent-life-points" : "player-life-points"
              }
            >
              {lifePoints > 0 ? lifePoints : 0}
            </LifePointsText>
          </LifePointsContainer>
        </Box>
        <MomentumBarContainer>
          {boxes.map((boxColor, i) => {
            const isEmptyBox = boxColor === EMPTY_BOX_COLOR;
            const finalColor = isFull ? FULL_MOMENTUM_COLOR : boxColor;
            const animation = getMomentumBoxAnimation(i, finalColor);

            return (
              <motion.div
                key={i}
                {...animation}
                style={getMomentumBoxStyles({
                  isEmpty: isEmptyBox,
                  boxColor: finalColor,
                })}
              />
            );
          })}
        </MomentumBarContainer>
      </PlayerContent>
    </PlayerContainer>
  );
};
