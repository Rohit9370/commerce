import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import notificationsReducer from './slices/notificationSlice';
import onboardingReducer from './slices/onboardingSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  notifications: notificationsReducer,
  onboarding: onboardingReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) => getDefault(),
});

export const selectAuth = (state) => state.auth;
export const selectNotifications = (state) => state.notifications;
export const selectOnboarding = (state) => state.onboarding;

export const AppDispatch = () => store.dispatch;
