import FinalCardImage from "@/assets/final-card-design.png";

export const FinalCard = () => (
  <img
    src={FinalCardImage}
    alt="FinalCard of card"
    style={{
      width: "192px",
      height: "277px",
      userSelect: "none",
      pointerEvents: "none",
    }}
  />
);
