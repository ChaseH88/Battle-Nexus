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
      style={{ width: 160, height: 253, display: "inline-block" }}
    >
      <img
        src={backImage}
        alt="Back of card"
        style={{ ...imageStyles, width: 140 }}
      />
      <div className="card-name" style={{ fontSize: "12px" }}>
        ???
      </div>
      <div className="card-type" style={{ fontSize: "10px" }}>
        FACE-DOWN
      </div>
      {isCreature && (
        <div className="card-mode-badge" style={{ fontSize: "10px" }}>
          Defense Mode!
        </div>
      )}
    </div>
  );
};

export const imageStyles: CSSProperties = {
  maxWidth: "100%",
  width: 150,
};
