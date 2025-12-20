import { GameState } from "../../../battle/GameState";

interface GameLogProps extends Pick<GameState, "log"> {}

export const GameLog = ({ log }: GameLogProps) => (
  <div className="game-log">
    <h4>Game Log</h4>
    <div className="log-entries">
      {log
        .slice(-10)
        .reverse()
        .map((entry, i) => (
          <div key={i} className="log-entry">
            {entry}
          </div>
        ))}
    </div>
  </div>
);
