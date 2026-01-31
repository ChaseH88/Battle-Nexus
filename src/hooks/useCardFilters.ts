import { Affinity, CardType } from "@/cards";
import { CardData } from "@/ui/DeckBuilder/DeckBuilder";
import { useCallback, useMemo, useState } from "react";

interface UseCardFiltersParams {
  availableCards: CardData[];
}

export interface UseCardFiltersReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterType: CardType | "ALL";
  setFilterType: (type: CardType | "ALL") => void;
  filterAffinity: Affinity | "ALL";
  setFilterAffinity: (affinity: Affinity | "ALL") => void;
  filterCost: number | "ALL";
  setFilterCost: (cost: number | "ALL") => void;
  filteredCards: CardData[];
  handleClearFilters: () => void;
  hasFilterApplied: boolean;
}

export const useCardFilters = ({
  availableCards,
}: UseCardFiltersParams): UseCardFiltersReturn => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<CardType | "ALL">("ALL");
  const [filterAffinity, setFilterAffinity] = useState<Affinity | "ALL">("ALL");
  const [filterCost, setFilterCost] = useState<number | "ALL">("ALL");

  const filteredCards = useMemo(
    () =>
      availableCards.filter((card) => {
        // text search - name or description
        const matchesSearch =
          card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.description.toLowerCase().includes(searchTerm.toLowerCase());
        // type filter
        const matchesType = filterType === "ALL" || card.type === filterType;
        // affinity filter
        const matchesAffinity =
          filterAffinity === "ALL" || card.affinity === filterAffinity;
        // cost filter
        const matchesCost = filterCost === "ALL" || card.cost === filterCost;
        return matchesSearch && matchesType && matchesAffinity && matchesCost;
      }),
    [searchTerm, filterType, filterAffinity, availableCards, filterCost],
  );

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setFilterType("ALL");
    setFilterAffinity("ALL");
    setFilterCost("ALL");
  }, []);

  const hasFilterApplied = useMemo(
    () =>
      searchTerm !== "" ||
      filterType !== "ALL" ||
      filterAffinity !== "ALL" ||
      filterCost !== "ALL",
    [searchTerm, filterType, filterAffinity, filterCost],
  );

  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filterAffinity,
    setFilterAffinity,
    filterCost,
    setFilterCost,
    filteredCards,
    handleClearFilters,
    hasFilterApplied,
  };
};
