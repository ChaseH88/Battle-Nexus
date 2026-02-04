import { MagicCard } from "@cards/MagicCard";
import { CardImage } from "./CardImage";

type ActionProps = Pick<
  MagicCard,
  | "id"
  | "name"
  | "type"
  | "description"
  | "cost"
  | "speed"
  | "isActive"
  | "isFaceDown"
  | "image"
>;

export const Action = ({
  id,
  name,
  type,
  description,
  cost,
  speed,
  isActive,
  isFaceDown,
  image,
}: ActionProps) => {
  if (isFaceDown) {
    return (
      <article
        className="action-card-details face-down"
        style={{
          width: "100%",
          height: "100%",
          fontSize: "11px",
          padding: "8px",
          boxSizing: "border-box",
        }}
      >
        <div>
          <div className="card-type" style={{ fontSize: "9px" }}>
            FACE DOWN
          </div>
          <div
            className="card-name"
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            ???
          </div>
        </div>
        <div
          style={{
            height: 80,
            width: 80,
            background: "#333",
            margin: "4px auto",
            border: "2px solid #666",
          }}
        />
        <div
          className="card-description"
          style={{ fontSize: "9px", lineHeight: "1.2" }}
        >
          Hidden card
        </div>
      </article>
    );
  }

  return (
    <article
      className="action-card-details"
      style={{
        width: "100%",
        height: "100%",
        fontSize: "11px",
        padding: "8px",
        boxSizing: "border-box",
      }}
    >
      <div>
        <div className="card-type" style={{ fontSize: "9px" }}>
          {type}
        </div>
        <div
          className="card-name"
          style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}
        >
          {name}
        </div>
        {cost !== undefined && (
          <div className="card-cost" style={{ fontSize: "10px" }}>
            Cost: {cost}
          </div>
        )}
        <div className="card-speed" style={{ fontSize: "10px" }}>
          Speed: {speed}
        </div>
      </div>
      <CardImage card={{ id, name, image }} width={80} height={80} />
      <div
        className="card-description"
        style={{ fontSize: "9px", marginBottom: "4px", lineHeight: "1.2" }}
      >
        {description}
      </div>
      {isActive && (
        <div
          className="active-badge"
          style={{ fontSize: "9px", padding: "2px 4px" }}
        >
          ACTIVE
        </div>
      )}
    </article>
  );
};
