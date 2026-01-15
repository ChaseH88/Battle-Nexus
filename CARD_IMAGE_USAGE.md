// CardImage Component Usage Examples
// 
// The CardImage component can be used anywhere you need to display card artwork
// It automatically handles:
// - Dynamic image loading from /src/assets/cards/
// - Fallback to placeholder if image not found
// - Loading states with pulse animation
// - Error handling
//
// Usage Examples:

import { CardImage } from "@ui/Battle/Card/CardImage";
import { CardInterface } from "@cards/types";

// Example 1: Basic usage with a card object
const card: Pick<CardInterface, "id" | "name" | "image"> = {
  id: "riptide_pixie",
  name: "Riptide Pixie",
  image: "riptide_pixie.jpg",
};

<CardImage card={card} width={100} height={100} />;

// Example 2: Card without image (shows placeholder)
const cardNoImage: Pick<CardInterface, "id" | "name" | "image"> = {
  id: "ember_cub",
  name: "Ember Cub",
  image: undefined, // or omit the property
};

<CardImage card={cardNoImage} width={80} height={80} />;

// Example 3: Custom alt text
<CardImage
  card={{ id: "call_home", name: "Call Home", image: "call_home.jpg" }}
  width={120}
  height={120}
  alt="Call Home Action Card"
/>;

// Example 4: In Action/Support cards
// Add to Support.tsx and Action.tsx components similarly to Creature.tsx:
//
// 1. Add 'id' and 'image' to the component props
// 2. Import CardImage component
// 3. Replace placeholder div with:
//    <CardImage card={{ id, name, image }} width={80} height={80} />

// Cards with images available:
// - riptide_pixie.jpg
// - mossback_scarab.jpg
// - lumen_sprite.jpg
// - call_home.jpg
// - fusiondrive.jpg

export {};
