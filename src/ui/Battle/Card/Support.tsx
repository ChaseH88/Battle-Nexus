import { SupportCard } from "@cards/SupportCard";

interface SupportProps
  extends Pick<
    SupportCard,
    "name" | "type" | "description" | "cost" | "isActive" | "isFaceDown"
  > {
  targetPlayerIndex?: 0 | 1;
  targetLane?: number;
}

export const Support = ({
  name,
  type,
  description,
  cost,
  isActive,
  isFaceDown,
}: SupportProps) => {
  if (isFaceDown) {
    return (
      <article
        className="support-card-details face-down"
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
      className="support-card-details"
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
          {typeof targetLane === "number" && (
            <div
              className="support-target-tooltip"
              title="This support will remain while the target is present"
              style={{
                fontSize: "10px",
                color: "#444",
                padding: "4px",
                borderTop: "1px solid #eee",
                marginTop: "6px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: "#f59e0b",
                  color: "white",
                  textAlign: "center",
                  lineHeight: "14px",
                  fontSize: 11,
                }}
              >
                i
              </span>
              <span>This support will remain while its target is present</span>
            </div>
          )}
        </div>
        {cost !== undefined && (
          <div className="card-cost" style={{ fontSize: "10px" }}>
            Cost: {cost}
          </div>
        )}
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
