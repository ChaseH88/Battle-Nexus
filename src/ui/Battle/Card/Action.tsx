import { ActionCard } from "../../../cards/ActionCard";

interface ActionProps
  extends Pick<
    ActionCard,
    "name" | "type" | "description" | "cost" | "speed" | "isActive"
  > {}

export const Action = ({
  name,
  type,
  description,
  cost,
  speed,
  isActive,
}: ActionProps) => (
  <article className="action-card-details">
    <div>
      <div className="card-type">{type}</div>
      <div className="card-name">{name}</div>
      {cost !== undefined && <div className="card-cost">Cost: {cost}</div>}
      <div className="card-speed">Speed: {speed}</div>
    </div>
    <div
      style={{
        height: 100,
        width: 100,
        background: "white",
        margin: "0 auto 10px",
      }}
    />
    <div className="card-description">{description}</div>
    {isActive && <div className="active-badge">ACTIVE</div>}
  </article>
);
