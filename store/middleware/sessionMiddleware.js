/**
 * Session Middleware - Handles session expiry and other session-related logic
 * This middleware can be used to:
 * - Track user inactivity
 * - Auto-logout after session timeout
 * - Refresh session tokens
 * - Handle session conflicts
 */

import { logoutUser } from "../slices/authSlice";

let inactivityTimer = null;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const createSessionMiddleware = () => {
  return (store) => (next) => (action) => {
    // Call the next dispatch method in the middleware chain
    const result = next(action);

    // Session-related actions
    const state = store.getState();
    const { isAuthenticated } = state.auth;

    // Clear inactivity timer on any action
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    // Set new inactivity timer if user is authenticated
    if (isAuthenticated) {
      inactivityTimer = setTimeout(() => {
        console.log("Session timeout due to inactivity");
        store.dispatch(logoutUser());
      }, INACTIVITY_TIMEOUT);
    }

    return result;
  };
};

/**
 * Refresh session function - called to extend session duration
 */
export const refreshSession = async (getState, dispatch) => {
  try {
    const { auth } = getState();
    if (auth.isAuthenticated && auth.uid) {
      // Session is still valid, no action needed
      // In production, you might want to refresh auth tokens here
      console.log("Session refreshed");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error refreshing session:", error);
    return false;
  }
};
