import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./uiSlice";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          "ui/openModal",
          "ui/queueEffectNotification",
          "ui/openCardDetailModal",
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          "payload.onConfirm",
          "payload.onCancel",
          "payload.card",
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          "ui.modal.onConfirm",
          "ui.modal.onCancel",
          "ui.effectNotificationQueue",
          "ui.cardDetailModal.card",
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
