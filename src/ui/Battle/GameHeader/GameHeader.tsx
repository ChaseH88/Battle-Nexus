interface GameHeaderProps {
  isGameOver: boolean;
  winnerName: string;
  turn: number;
  currentPlayerName: string;
  phase: string;
  onNewGame: () => void;
}

export const GameHeader = ({
  isGameOver,
  winnerName,
  turn,
  currentPlayerName,
  phase,
  onNewGame,
}: GameHeaderProps) => (
  <div className="game-header">
    <h1>Battle Nexus</h1>
    {isGameOver ? (
      <div className="game-over">
        <h2>Game Over! {winnerName} Wins!</h2>
        <button onClick={onNewGame}>New Game</button>
      </div>
    ) : (
      <div className="turn-info">
        <span>Turn: {turn}</span>
        <span>Active: {currentPlayerName}</span>
        <span className={`phase ${phase.toLowerCase()}`}>Phase: {phase}</span>
      </div>
    )}
  </div>
);
