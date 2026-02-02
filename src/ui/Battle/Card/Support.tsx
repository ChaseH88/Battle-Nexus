import { SupportCard } from "@cards/SupportCard";
import { CardImage } from "./CardImage";
import { Box } from "@mui/material";
import { CARD_IMAGE_DIMENSIONS } from "./cardDimensions";
import { Cost } from "./Common/Cost";

interface SupportProps extends Pick<
  SupportCard,
  | "id"
  | "name"
  | "type"
  | "description"
  | "cost"
  | "isActive"
  | "isFaceDown"
  | "image"
> {
  targetPlayerIndex?: 0 | 1;
}

export const Support = ({
  id,
  name,
  type,
  description,
  cost,
  isActive,
  isFaceDown,
  image,
}: SupportProps) => {
  if (isFaceDown) {
    return (
      <article
        className="support-card-details face-down"
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
      className="support-card-details"
      style={{
        width: "100%",
        height: "100%",
        fontSize: "11px",
        padding: "8px",
        boxSizing: "border-box",
      }}
    >
      <div>
        <Box>
          <Cost
            cost={cost}
            size={16}
            sx={{
              position: "relative",
              right: "4px",
            }}
          />
        </Box>
        <div className="card-type" style={{ fontSize: "9px" }}>
          {type}
        </div>
        <div
          className="card-name"
          style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}
        >
          {name}
        </div>
      </div>
      <Box height={CARD_IMAGE_DIMENSIONS.HEIGHT} marginBottom="4px">
        <CardImage card={{ id, name, image }} />
      </Box>
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
