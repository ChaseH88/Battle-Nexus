import { CSSProperties, useMemo } from "react";
import backImage from "../../../assets/card-back.png";

interface BackProps {
  onClick?: () => void;
  type: "creature" | "support" | "action";
}

export const Back = ({ onClick, type }: BackProps) => {
  const isCreature = useMemo(() => type === "creature", [type]);

  return (
    <div
      className={`card-slot face-down ${type} ${
        isCreature ? "defense-mode" : ""
      }`}
      onClick={onClick}
    >
      <img src={backImage} alt="Back of card" style={imageStyles} />
      <div className="card-name">???</div>
      <div className="card-type">FACE-DOWN</div>
      {isCreature && <div className="card-mode-badge">Defense Mode!</div>}
    </div>
  );
};

export const imageStyles: CSSProperties = {
  maxWidth: "100%",
  width: 150,
};
