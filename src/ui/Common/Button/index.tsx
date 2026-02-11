import React from "react";
import { ButtonProps as MuiButtonProps } from "@mui/material";
import { StyledButton, ButtonVariant, ButtonSize } from "./styled";

export interface GameButtonProps extends Omit<
  MuiButtonProps,
  "variant" | "size"
> {
  /**
   * Visual style variant of the button
   * @default "primary"
   */
  variant?: ButtonVariant;

  /**
   * Size of the button
   * @default "medium"
   */
  size?: ButtonSize;

  /**
   * If true, button will take full width of container
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Button content
   */
  children: React.ReactNode;

  /**
   * Click handler
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;

  /**
   * If true, button is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Type of button
   * @default "button"
   */
  type?: "button" | "submit" | "reset";

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Icon to display before button text
   */
  startIcon?: React.ReactNode;

  /**
   * Icon to display after button text
   */
  endIcon?: React.ReactNode;
}

/**
 * GameButton - Unified button component for the entire application
 *
 * Features:
 * - Multiple visual variants (primary, secondary, danger, success, ghost)
 * - Three sizes (small, medium, large)
 * - Full width option
 * - Icon support
 * - Disabled state handling
 * - Consistent styling across the app
 * - Built-in hover and active states
 * - Accessibility support
 *
 * @example
 * ```tsx
 * <GameButton variant="primary" size="large" onClick={handleClick}>
 *   Start Game
 * </GameButton>
 *
 * <GameButton variant="danger" disabled>
 *   Delete Deck
 * </GameButton>
 *
 * <GameButton variant="ghost" startIcon={<AddIcon />}>
 *   Add Card
 * </GameButton>
 * ```
 */
export const GameButton = React.forwardRef<HTMLButtonElement, GameButtonProps>(
  (
    {
      variant = "primary",
      size = "medium",
      fullWidth = false,
      children,
      onClick,
      disabled = false,
      type = "button",
      className,
      startIcon,
      endIcon,
      ...muiProps
    },
    ref,
  ) => {
    return (
      <StyledButton
        ref={ref}
        $variant={variant}
        $size={size}
        $fullWidth={fullWidth}
        onClick={onClick}
        disabled={disabled}
        type={type}
        className={className}
        startIcon={startIcon}
        endIcon={endIcon}
        {...muiProps}
      >
        {children}
      </StyledButton>
    );
  },
);

GameButton.displayName = "GameButton";

// Export types for consumers
export type { ButtonVariant, ButtonSize };
