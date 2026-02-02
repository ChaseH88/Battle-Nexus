import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CardInterface } from "../cards/types";
import { ActiveEffect } from "../battle/GameState";

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface CardDetailModalState {
  isOpen: boolean;
  card: CardInterface | null;
  activeEffects: ActiveEffect[];
  playerIndex?: 0 | 1;
  originRect?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
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

interface EffectNotification {
  card: CardInterface;
  effectName: string;
  activeEffects: ActiveEffect[];
}

interface UIState {
  modal: ModalState;
  playCreatureModal: PlayCreatureModalState;
  selectedHandCard: string | null;
  selectedAttacker: number | null;
  targetSelectModal: TargetSelectModalState;
  cardDetailModal: CardDetailModalState;
  effectNotificationQueue: EffectNotification[];
  isShowingEffectNotification: boolean;
}

const initialState: UIState = {
  modal: {
    isOpen: false,
    title: "",
    message: "",
    onConfirm: undefined,
    onCancel: undefined,
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
    originRect: undefined,
  },
  selectedHandCard: null,
  selectedAttacker: null,
  effectNotificationQueue: [],
  isShowingEffectNotification: false,
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
      action: PayloadAction<{ lane: number; creatureName: string }>,
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
      action: PayloadAction<Omit<TargetSelectModalState, "isOpen">>,
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
        playerIndex?: 0 | 1;
        originRect?: {
          left: number;
          top: number;
          width: number;
          height: number;
        };
      }>,
    ) => {
      state.cardDetailModal = {
        isOpen: true,
        card: action.payload.card,
        activeEffects: action.payload.activeEffects,
        playerIndex: action.payload.playerIndex,
        originRect: action.payload.originRect,
      };
    },
    closeCardDetailModal: (state) => {
      state.cardDetailModal = initialState.cardDetailModal;
    },
    queueEffectNotification: (
      state,
      action: PayloadAction<EffectNotification>,
    ) => {
      state.effectNotificationQueue.push(action.payload);
      // Cap at 10 notifications to prevent memory leak
      if (state.effectNotificationQueue.length > 10) {
        state.effectNotificationQueue =
          state.effectNotificationQueue.slice(-10);
      }
    },
    dequeueEffectNotification: (state) => {
      state.effectNotificationQueue.shift();
    },
    setShowingEffectNotification: (state, action: PayloadAction<boolean>) => {
      state.isShowingEffectNotification = action.payload;
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
  queueEffectNotification,
  dequeueEffectNotification,
  setShowingEffectNotification,
} = uiSlice.actions;

export default uiSlice.reducer;
