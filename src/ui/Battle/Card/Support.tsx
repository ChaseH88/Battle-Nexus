import { SupportCard } from "../../../cards/SupportCard";

interface SupportProps
  extends Pick<
    SupportCard,
    "name" | "type" | "description" | "cost" | "isActive"
  > {}

export const Support = ({
  name,
  type,
  description,
  cost,
  isActive,
}: SupportProps) => (
  <article className="support-card-details">
    <div>
      <div className="card-type">{type}</div>
      <div className="card-name">{name}</div>
      {cost !== undefined && <div className="card-cost">Cost: {cost}</div>}
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
