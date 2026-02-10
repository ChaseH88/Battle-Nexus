import { useState } from "react";
import { GameState } from "../../../battle/GameState";
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from "@mui/material";
import {
  ExitToApp as EndTurnIcon,
  RestartAlt as NewGameIcon,
} from "@mui/icons-material";

interface ControlsProps extends Pick<GameState, "phase"> {
  isGameOver: boolean;
  handleEndTurn: () => void;
  startNewGame: () => void;
  isPlayerTurn?: boolean;
  showEndTurnButton?: boolean;
  isShowingEffectNotification?: boolean;
}

export const Controls = ({
  phase,
  isGameOver,
  handleEndTurn,
  startNewGame,
  isPlayerTurn = true,
  isShowingEffectNotification = false,
}: ControlsProps) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const actions = [
    ...(isPlayerTurn && phase !== "DRAW"
      ? [
          {
            icon: <EndTurnIcon />,
            name: "End Turn",
            onClick: () => {
              handleEndTurn();
              handleClose();
            },
            disabled: isGameOver || isShowingEffectNotification,
            testId: "end-turn-button",
          },
        ]
      : []),
    {
      icon: <NewGameIcon />,
      name: "New Game",
      onClick: () => {
        startNewGame();
        handleClose();
      },
      disabled: !isPlayerTurn || isShowingEffectNotification,
      testId: "new-game-button",
    },
  ];

  return (
    <SpeedDial
      ariaLabel="Battle Controls"
      sx={{
        position: "fixed",
        bottom: 20,
        right: 20,
        "& .MuiFab-primary": {
          background: "linear-gradient(145deg, #4299e1, #3182ce)",
          "&:hover": {
            background: "linear-gradient(145deg, #3182ce, #2c5282)",
          },
        },
      }}
      icon={<SpeedDialIcon />}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
      direction="up"
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          tooltipOpen
          onClick={action.onClick}
          FabProps={{
            disabled: action.disabled,
            sx: {
              background: "linear-gradient(145deg, #4299e1, #3182ce)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(145deg, #3182ce, #2c5282)",
              },
              "&.Mui-disabled": {
                background: "#4a5568",
                opacity: 0.5,
              },
            },
            // @ts-ignore - data-testid is not in FabProps type but is valid HTML attribute
            "data-testid": action.testId,
          }}
        />
      ))}
    </SpeedDial>
  );
};
