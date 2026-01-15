import { Box, Typography } from "@mui/material";

export const StatBox = ({
  label,
  value,
  isModified,
  baseValue,
}: {
  label: string;
  value: number;
  isModified?: boolean;
  baseValue?: number;
}) => (
  <Box
    className={`stat-box ${isModified ? "modified" : ""}`}
    data-testid={`stat-box-${label.toLowerCase()}`}
  >
    <Typography className="stat-label">{label}:</Typography>
    <Typography className="stat-value">
      {value}
      {isModified && baseValue !== undefined && (
        <Typography className="base-stat">({baseValue})</Typography>
      )}
      {isModified && (
        <Typography className="stat-icon" title="Modified">
          ⚡
        </Typography>
      )}
    </Typography>
  </Box>
);
