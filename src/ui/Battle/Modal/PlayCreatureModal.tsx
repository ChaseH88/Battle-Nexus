interface PlayCreatureModalProps {
  isOpen: boolean;
  creatureName: string;
  onPlayFaceUpAttack: () => void;
  onPlayFaceUpDefense: () => void;
  onPlayFaceDownAttack: () => void;
  onPlayFaceDownDefense: () => void;
  onCancel: () => void;
}

export const PlayCreatureModal = ({
  isOpen,
  creatureName,
  onPlayFaceUpAttack,
  onPlayFaceUpDefense,
  onPlayFaceDownAttack,
  onPlayFaceDownDefense,
  onCancel,
}: PlayCreatureModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content play-creature-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="modal-title">Play {creatureName}</h3>
        <p className="modal-message">Choose how to play this creature:</p>

        <div className="play-options">
          <div className="play-option-group">
            <h4>Face-Up</h4>
            <button
              className="modal-button play-option attack"
              onClick={onPlayFaceUpAttack}
            >
              Attack Mode
            </button>
            <button
              className="modal-button play-option defense"
              onClick={onPlayFaceUpDefense}
            >
              Defense Mode
            </button>
          </div>

          <div className="play-option-group">
            <h4>Face-Down</h4>
            <button
              className="modal-button play-option attack"
              onClick={onPlayFaceDownAttack}
            >
              Attack Mode
            </button>
            <button
              className="modal-button play-option defense"
              onClick={onPlayFaceDownDefense}
            >
              Defense Mode
            </button>
          </div>
        </div>

        <button className="modal-button cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};
