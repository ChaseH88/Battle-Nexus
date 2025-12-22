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
} = uiSlice.actions;

export default uiSlice.reducer;
