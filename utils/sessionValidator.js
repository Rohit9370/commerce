import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../app/services/firebaseconfig";
import { setAuth } from "../store/slices/authSlice";

/**
 * Background Session Verification
 *
 * Strategy:
 * 1. Load cached auth data immediately (fast!)
 * 2. Verify with Firebase in background (doesn't block UI)
 * 3. Update Redux if data changed
 *
 * Result: User sees home screen in ~1 second instead of 3-5 seconds
 */

export const verifySessionInBackground = async (dispatch) => {
  try {
    // Get cached auth data from AsyncStorage
    const cachedAuthStr = await AsyncStorage.getItem("user_auth_data");

    if (cachedAuthStr) {
      try {
        const cachedAuth = JSON.parse(cachedAuthStr);

        // Use cached data immediately - don't wait!
        dispatch(setAuth(cachedAuth));

        // Schedule background verification (fire and forget)
        setTimeout(async () => {
          try {
            // Verify user data is still fresh
            const userDoc = await getDoc(doc(db, "users", cachedAuth.uid));

            if (userDoc.exists()) {
              const freshData = userDoc.data();

              // Check if data changed
              const dataChanged =
                JSON.stringify(freshData) !==
                JSON.stringify(cachedAuth.userData);

              if (dataChanged) {
                // Update Redux with fresh data
                dispatch(
                  setAuth({
                    uid: cachedAuth.uid,
                    email: cachedAuth.email,
                    role: freshData.role || cachedAuth.role,
                    userData: freshData,
                  }),
                );

                console.log("Session: Updated fresh user data from Firestore");
              }
            } else {
              // User doc doesn't exist, user was deleted
              console.warn("Session: User document not found in Firestore");
            }
          } catch (error) {
            // Background verification failed - not critical
            console.log(
              "Session: Background verification failed (non-blocking):",
              error.message,
            );
            // Continue using cached data
          }
        }, 0); // Don't wait for this

        return true;
      } catch (parseError) {
        console.error("Session: Invalid cached auth data:", parseError);
        await AsyncStorage.removeItem("user_auth_data");
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error("Session restore error:", error);
    return false;
  }
};

/**
 * Cache user data with automatic expiry
 *
 * Usage:
 * const userData = await getCachedUserData(uid);
 */

const CACHE_EXPIRY = 1 * 60 * 60 * 1000; // 1 hour

export const getCachedUserData = async (uid) => {
  try {
    // Check if cached data exists and is fresh
    const cachedStr = await AsyncStorage.getItem(`user_${uid}`);
    const expiryStr = await AsyncStorage.getItem(`user_${uid}_expiry`);

    if (cachedStr && expiryStr) {
      const expiry = new Date(expiryStr);

      if (new Date() < expiry) {
        // Cache is valid, return immediately
        console.log("Cache hit for user", uid);
        return JSON.parse(cachedStr);
      }
    }

    // Cache expired or doesn't exist - fetch fresh data
    console.log("Cache miss for user", uid, "- fetching fresh data");
    const userDoc = await getDoc(doc(db, "users", uid));

    if (userDoc.exists()) {
      const data = userDoc.data();

      // Save to cache with expiry
      await AsyncStorage.setItem(`user_${uid}`, JSON.stringify(data));
      await AsyncStorage.setItem(
        `user_${uid}_expiry`,
        new Date(Date.now() + CACHE_EXPIRY).toISOString(),
      );

      return data;
    }

    return null;
  } catch (error) {
    console.error("User data cache error:", error);
    return null;
  }
};

/**
 * Clear all cached data (useful on logout)
 */
export const clearUserCache = async (uid) => {
  try {
    await AsyncStorage.removeItem(`user_${uid}`);
    await AsyncStorage.removeItem(`user_${uid}_expiry`);
    console.log("Cache cleared for user:", uid);
  } catch (error) {
    console.error("Error clearing user cache:", error);
  }
};

/**
 * Clear all auth caches
 */
export const clearAllAuthCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const userCacheKeys = keys.filter(
      (key) => key.startsWith("user_") && !key.endsWith("_expiry"),
    );

    await AsyncStorage.multiRemove(userCacheKeys);
    console.log("All user caches cleared");
  } catch (error) {
    console.error("Error clearing all caches:", error);
  }
};
