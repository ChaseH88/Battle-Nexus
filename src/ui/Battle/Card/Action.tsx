import { ActionCard } from "@cards/ActionCard";

interface ActionProps
  extends Pick<
    ActionCard,
    | "name"
    | "type"
    | "description"
    | "cost"
    | "speed"
    | "isActive"
    | "isFaceDown"
  > {}

export const Action = ({
  name,
  type,
  description,
  cost,
  speed,
  isActive,
  isFaceDown,
}: ActionProps) => {
  if (isFaceDown) {
    return (
      <article
        className="action-card-details face-down"
        style={{ width: 160, height: 253, fontSize: "11px", padding: "8px" }}
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
      style={{ width: 160, height: 253, fontSize: "11px", padding: "8px" }}
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
      <div
        style={{
          height: 80,
          width: 80,
          background: "white",
          margin: "4px auto",
        }}
      />
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
