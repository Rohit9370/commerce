import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, restoreSession } from "../store/slices/authSlice";
import {
    completeOnboarding,
    resetOnboardingStatus,
} from "../store/slices/onboardingSlice";

/**
 * Custom hook for managing user sessions and authentication state
 * Handles:
 * - Session restoration on app startup
 * - Session monitoring
 * - Logout functionality (clears everything)
 * - Onboarding state management
 */
export const useSessionManagement = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { uid, isAuthenticated, ready } = useSelector((state) => state.auth);
  const { hasOnboarded } = useSelector((state) => state.onboarding);

  // Restore session on app startup
  useEffect(() => {
    if (!ready) {
      dispatch(restoreSession());
    }
  }, [dispatch, ready]);

  // Logout function - clears everything
  const logout = async () => {
    try {
      await dispatch(logoutUser());
      // Navigate to login screen after logout
      router.replace("/auth/login");
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  };

  // Complete onboarding
  const completeUserOnboarding = async () => {
    try {
      await dispatch(completeOnboarding());
      return true;
    } catch (error) {
      console.error("Error completing onboarding:", error);
      return false;
    }
  };

  // Reset onboarding (for testing or when needed)
  const resetUserOnboarding = async () => {
    try {
      await dispatch(resetOnboardingStatus());
      return true;
    } catch (error) {
      console.error("Error resetting onboarding:", error);
      return false;
    }
  };

  return {
    isAuthenticated,
    hasOnboarded,
    uid,
    ready,
    logout,
    completeUserOnboarding,
    resetUserOnboarding,
  };
};
