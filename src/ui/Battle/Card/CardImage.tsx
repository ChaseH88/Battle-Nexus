import { useState } from "react";
import { CardInterface } from "@cards/types";
import { Box, SxProps } from "@mui/material";
import { CARD_IMAGE_DIMENSIONS } from "./cardDimensions";

// Use Vite's import.meta.glob to dynamically import all images in the cards folder
const imageModules = import.meta.glob<{ default: string }>(
  "../../../assets/cards/*.{jpg,jpeg,png,webp}",
  { eager: true },
);

// Create a mapping from filename to image URL
const IMAGE_MAP: Record<string, string> = {};
Object.keys(imageModules).forEach((path) => {
  const filename = path.split("/").pop();
  if (filename) {
    IMAGE_MAP[filename] = imageModules[path].default;
  }
});

interface CardImageProps {
  card: Pick<CardInterface, "id" | "name" | "image">;
  alt?: string;
  sx?: SxProps;
}

/**
 * CardImage component - Displays card images from assets/cards
 * Falls back to placeholder if image not found or not specified
 */
export const CardImage = ({ card, alt, sx }: CardImageProps) => {
  const [imageError, setImageError] = useState(false);
  const styles: SxProps = {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    ...sx,
  };

  // Get the image source from the mapping
  const imageSrc = card.image ? IMAGE_MAP[card.image] : null;

  // If no image specified or not found in mapping, show placeholder
  if (!card.image || !imageSrc || imageError) {
    return (
      <Box
        sx={{
          width: CARD_IMAGE_DIMENSIONS.WIDTH - 2,
          height: CARD_IMAGE_DIMENSIONS.HEIGHT - 2,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
          color: "white",
          fontSize: "10px",
          textAlign: "center",
          padding: "4px",
          ...styles,
        }}
      >
        {"Image Not Available"}
      </Box>
    );
  }

  // Show image
  return (
    <Box sx={styles}>
      <img
        src={imageSrc}
        alt={alt || card.name}
        onError={() => setImageError(true)}
        style={{
          width: CARD_IMAGE_DIMENSIONS.WIDTH - 2,
          height: "auto",
          objectFit: "cover",
          objectPosition: "center center",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </Box>
  );
};
