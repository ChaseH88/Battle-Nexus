import { GameState } from "../../../battle/GameState";
import { GameLogContainer, GameLogTitle, LogEntries, LogEntry } from "./styled";

interface GameLogProps extends Pick<GameState, "log"> {}

export const GameLog = ({ log }: GameLogProps) => (
  <GameLogContainer>
    <GameLogTitle>Game Log</GameLogTitle>
    <LogEntries>
      {log
        .slice(-10)
        .reverse()
        .map((entry, i) => (
          <LogEntry key={i}>{entry}</LogEntry>
        ))}
    </LogEntries>
  </GameLogContainer>
);
