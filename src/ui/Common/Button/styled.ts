import styled, { css } from "styled-components";
import { Button as MuiButton } from "@mui/material";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "ghost";
export type ButtonSize = "small" | "medium" | "large";

interface StyledButtonProps {
  $variant?: ButtonVariant;
  $size?: ButtonSize;
  $fullWidth?: boolean;
}

const variantStyles = (variant: ButtonVariant = "primary") => {
  const variants = {
    primary: css`
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
    `,
    secondary: css`
      background: #424242;
      color: #ffffff;

      &:hover:not(:disabled) {
        background: #616161;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
    `,
    danger: css`
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
      color: #ffffff;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #ee5a6f 0%, #ff6b6b 100%);
        box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
      }
    `,
    success: css`
      background: linear-gradient(135deg, #51cf66 0%, #37b24d 100%);
      color: #ffffff;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #37b24d 0%, #51cf66 100%);
        box-shadow: 0 4px 12px rgba(81, 207, 102, 0.4);
      }
    `,
    ghost: css`
      background: transparent;
      color: #ffffff;
      border: 2px solid #667eea;

      &:hover:not(:disabled) {
        background: rgba(102, 126, 234, 0.1);
        border-color: #764ba2;
      }
    `,
  };

  return variants[variant];
};

const sizeStyles = (size: ButtonSize = "medium") => {
  const sizes = {
    small: css`
      padding: 6px 16px;
      font-size: 0.875rem;
      min-height: 32px;
    `,
    medium: css`
      padding: 10px 24px;
      font-size: 1rem;
      min-height: 40px;
    `,
    large: css`
      padding: 14px 32px;
      font-size: 1.125rem;
      min-height: 48px;
    `,
  };

  return sizes[size];
};

export const StyledButton = styled(MuiButton)<StyledButtonProps>(
  ({ $variant = "primary", $size = "medium", $fullWidth = false }) => css`
    ${variantStyles($variant)}
    ${sizeStyles($size)}
    
    width: ${$fullWidth ? "100%" : "auto"};
    border-radius: 8px;
    font-weight: 700;
    text-transform: none;
    letter-spacing: 0.05em;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
    position: relative;
    overflow: hidden;

    &:active:not(:disabled) {
      transform: scale(0.98);
    }

    &:disabled {
      background: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.3);
      cursor: not-allowed;
      opacity: 0.6;
      box-shadow: none;
    }

    &:focus-visible {
      outline: 2px solid #667eea;
      outline-offset: 2px;
    }

    /* Ripple effect enhancement */
    .MuiTouchRipple-root {
      opacity: 0.3;
    }
  `,
);
