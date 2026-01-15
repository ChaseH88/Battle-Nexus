import { useState } from "react";
import { CardInterface } from "@cards/types";

// Use Vite's import.meta.glob to dynamically import all images in the cards folder
const imageModules = import.meta.glob<{ default: string }>(
  "../../../assets/cards/*.{jpg,jpeg,png,webp}",
  { eager: true }
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
  width?: number;
  height?: number;
  alt?: string;
}

/**
 * CardImage component - Displays card images from assets/cards
 * Falls back to placeholder if image not found or not specified
 */
export const CardImage = ({
  card,
  width = 80,
  height = 80,
  alt,
}: CardImageProps) => {
  const [imageError, setImageError] = useState(false);

  // Get the image source from the mapping
  const imageSrc = card.image ? IMAGE_MAP[card.image] : null;

  // If no image specified or not found in mapping, show placeholder
  if (!card.image || !imageSrc || imageError) {
    return (
      <div
        style={{
          width,
          height,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
          color: "white",
          fontSize: "10px",
          textAlign: "center",
          padding: "4px",
        }}
      >
        {card.name.slice(0, 3).toUpperCase()}
      </div>
    );
  }

  // Show image
  return (
    <img
      src={imageSrc}
      alt={alt || card.name}
      onError={() => setImageError(true)}
      style={{
        width,
        height,
        objectFit: "cover",
        objectPosition: "center center",
        borderRadius: "4px",
        userSelect: "none",
        pointerEvents: "none",
      }}
    />
  );
};
