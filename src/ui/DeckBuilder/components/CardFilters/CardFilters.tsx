import { Affinity, CardType } from "@/cards";
import { UseCardFiltersReturn } from "@/hooks/useCardFilters";
import {
  Box,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  TextField,
} from "@mui/material";

type CardFiltersParams = Pick<
  UseCardFiltersReturn,
  | "searchTerm"
  | "setSearchTerm"
  | "filterType"
  | "setFilterType"
  | "filterAffinity"
  | "setFilterAffinity"
  | "filterCost"
  | "setFilterCost"
  | "handleClearFilters"
  | "hasFilterApplied"
>;

export const CardFilters = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterAffinity,
  setFilterAffinity,
  filterCost,
  setFilterCost,
  handleClearFilters,
  hasFilterApplied,
}: CardFiltersParams) => (
  <Box
    sx={{
      mb: 3,
      display: "flex",
      gap: 2,
      flexWrap: "wrap",
      alignItems: "center",
    }}
  >
    <TextField
      label="Search Cards"
      variant="outlined"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      sx={{
        flex: 1,
        minWidth: "200px",
        "& .MuiOutlinedInput-root": { color: "#fff" },
        "& .MuiInputLabel-root": { color: "#cbd5e0" },
      }}
    />
    <FormControl sx={{ minWidth: 150 }}>
      <InputLabel sx={{ color: "#cbd5e0" }}>Type</InputLabel>
      <Select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value as CardType | "ALL")}
        sx={{ color: "#fff" }}
      >
        <MenuItem value="ALL">All Types</MenuItem>
        <MenuItem value={CardType.Creature}>Creature</MenuItem>
        <MenuItem value={CardType.Action}>Action</MenuItem>
        <MenuItem value={CardType.Trap}>Trap</MenuItem>
      </Select>
    </FormControl>
    <FormControl sx={{ minWidth: 150 }}>
      <InputLabel sx={{ color: "#cbd5e0" }}>Cost</InputLabel>
      <Select
        value={filterCost}
        onChange={(e) => setFilterCost(e.target.value as number | "ALL")}
        sx={{ color: "#fff" }}
      >
        <MenuItem value="ALL">All</MenuItem>
        {Array.from({ length: 6 }, (_, i) => i).map((cost) => (
          <MenuItem key={cost} value={cost}>
            {cost}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    <FormControl sx={{ minWidth: 150 }}>
      <InputLabel sx={{ color: "#cbd5e0" }}>Affinity</InputLabel>
      <Select
        value={filterAffinity}
        onChange={(e) => setFilterAffinity(e.target.value as Affinity | "ALL")}
        sx={{ color: "#fff" }}
      >
        <MenuItem value="ALL">All Affinities</MenuItem>
        <MenuItem value="FIRE">Fire</MenuItem>
        <MenuItem value="WATER">Water</MenuItem>
        <MenuItem value="EARTH">Earth</MenuItem>
        <MenuItem value="WIND">Wind</MenuItem>
        <MenuItem value="LIGHT">Light</MenuItem>
        <MenuItem value="DARK">Dark</MenuItem>
        <MenuItem value="NEUTRAL">Neutral</MenuItem>
      </Select>
    </FormControl>
    <FormControl sx={{ minWidth: 150 }}>
      <Button
        variant="outlined"
        onClick={handleClearFilters}
        disabled={!hasFilterApplied}
        sx={{
          color: "#fff",
          borderColor: "#718096",
          "&:hover": {
            borderColor: "#a0aec0",
          },
        }}
      >
        Clear
      </Button>
    </FormControl>
  </Box>
);
