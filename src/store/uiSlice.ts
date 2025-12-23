import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CardInterface } from "../cards/types";
import { ActiveEffect } from "../battle/GameState";

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
}

interface CardDetailModalState {
  isOpen: boolean;
  card: CardInterface | null;
  activeEffects: ActiveEffect[];
}

interface PlayCreatureModalState {
  isOpen: boolean;
  lane: number;
  creatureName: string;
}

interface TargetSelectOption {
  label: string;
  value: any;
}

interface TargetSelectModalState {
  isOpen: boolean;
  title: string;
  message?: string;
  options: TargetSelectOption[];
  onConfirm?: (value: any) => void;
}

interface UIState {
  modal: ModalState;
  playCreatureModal: PlayCreatureModalState;
  selectedHandCard: string | null;
  selectedAttacker: number | null;
  targetSelectModal: TargetSelectModalState;
  cardDetailModal: CardDetailModalState;
}

const initialState: UIState = {
  modal: {
    isOpen: false,
    title: "",
    message: "",
    onConfirm: undefined,
  },
  playCreatureModal: {
    isOpen: false,
    lane: 0,
    creatureName: "",
  },
  targetSelectModal: {
    isOpen: false,
    title: "",
    message: "",
    options: [],
    onConfirm: undefined,
  },
  cardDetailModal: {
    isOpen: false,
    card: null,
    activeEffects: [],
  },
  selectedHandCard: null,
  selectedAttacker: null,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openModal: (state, action: PayloadAction<Omit<ModalState, "isOpen">>) => {
      state.modal = { ...action.payload, isOpen: true };
    },
    closeModal: (state) => {
      state.modal = initialState.modal;
    },
    openPlayCreatureModal: (
      state,
      action: PayloadAction<{ lane: number; creatureName: string }>
    ) => {
      state.playCreatureModal = {
        isOpen: true,
        ...action.payload,
      };
    },
    closePlayCreatureModal: (state) => {
      state.playCreatureModal = initialState.playCreatureModal;
    },
    openTargetSelectModal: (
      state,
      action: PayloadAction<Omit<TargetSelectModalState, "isOpen">>
    ) => {
      state.targetSelectModal = { ...action.payload, isOpen: true };
    },
    closeTargetSelectModal: (state) => {
      state.targetSelectModal = initialState.targetSelectModal;
    },
    setSelectedHandCard: (state, action: PayloadAction<string | null>) => {
      state.selectedHandCard = action.payload;
    },
    setSelectedAttacker: (state, action: PayloadAction<number | null>) => {
      state.selectedAttacker = action.payload;
    },
    openCardDetailModal: (
      state,
      action: PayloadAction<{
        card: CardInterface;
        activeEffects: ActiveEffect[];
      }>
    ) => {
      state.cardDetailModal = {
        isOpen: true,
        card: action.payload.card,
        activeEffects: action.payload.activeEffects,
      };
    },
    closeCardDetailModal: (state) => {
      state.cardDetailModal = initialState.cardDetailModal;
    },
  },
});

export const {
  openModal,
  closeModal,
  openPlayCreatureModal,
  closePlayCreatureModal,
  setSelectedHandCard,
  setSelectedAttacker,
  openTargetSelectModal,
  closeTargetSelectModal,
  openCardDetailModal,
  closeCardDetailModal,
} = uiSlice.actions;

export default uiSlice.reducer;
