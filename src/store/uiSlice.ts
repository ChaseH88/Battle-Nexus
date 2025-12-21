import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
}

interface PlayCreatureModalState {
  isOpen: boolean;
  lane: number;
  creatureName: string;
}

interface UIState {
  modal: ModalState;
  playCreatureModal: PlayCreatureModalState;
  selectedHandCard: string | null;
  selectedAttacker: number | null;
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
    setSelectedHandCard: (state, action: PayloadAction<string | null>) => {
      state.selectedHandCard = action.payload;
    },
    setSelectedAttacker: (state, action: PayloadAction<number | null>) => {
      state.selectedAttacker = action.payload;
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
} = uiSlice.actions;

export default uiSlice.reducer;
