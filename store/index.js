import AsyncStorage from "@react-native-async-storage/async-storage";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
    FLUSH,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
    REHYDRATE,
    persistReducer,
    persistStore,
} from "redux-persist";
import { createSessionMiddleware } from "./middleware/sessionMiddleware";
import authReducer from "./slices/authSlice";
import bookingsReducer from "./slices/bookingsSlice";
import notificationsReducer from "./slices/notificationSlice";
import onboardingReducer from "./slices/onboardingSlice";
import servicesReducer from "./slices/servicesSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  notifications: notificationsReducer,
  onboarding: onboardingReducer,
  services: servicesReducer,
  bookings: bookingsReducer,
});

// Redux Persist Configuration
const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth", "onboarding"], // Persist only auth and onboarding state
  timeout: 5000, // Reduced from 12s to 5s for faster app startup
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(createSessionMiddleware()),
});

export const persistor = persistStore(store);

export const selectAuth = (state) => state.auth;
export const selectNotifications = (state) => state.notifications;
export const selectOnboarding = (state) => state.onboarding;
export const selectServices = (state) => state.services;
export const selectBookings = (state) => state.bookings;

export const AppDispatch = () => store.dispatch;
