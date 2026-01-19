import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = 'user_auth_data';
const ONBOARDING_STORAGE_KEY = 'onboarding_completed';
const SESSION_EXPIRY_KEY = 'session_expiry';

// Auth helpers
export const saveAuthData = async (authData) => {
  try {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    
    // Set session expiry (24 hours from now)
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 24);
    await AsyncStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toISOString());
    
    return true;
  } catch (error) {
    console.error('Error saving auth data:', error);
    return false;
  }
};

export const getAuthData = async () => {
  try {
    // Check if session has expired
    const expiryString = await AsyncStorage.getItem(SESSION_EXPIRY_KEY);
    if (expiryString) {
      const expiryDate = new Date(expiryString);
      if (new Date() > expiryDate) {
        // Session has expired, clear stored data
        await clearAuthData();
        return null;
      }
    }
    
    const data = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting auth data:', error);
    return null;
  }
};

export const clearAuthData = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    await AsyncStorage.removeItem(SESSION_EXPIRY_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

export const isSessionValid = async () => {
  try {
    const authData = await getAuthData();
    return !!authData;
  } catch (error) {
    console.error('Error checking session validity:', error);
    return false;
  }
};

// Onboarding helpers
export const saveOnboardingStatus = async (completed) => {
  try {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(completed));
    return true;
  } catch (error) {
    console.error('Error saving onboarding status:', error);
    return false;
  }
};

export const getOnboardingStatus = async () => {
  try {
    const data = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    return data ? JSON.parse(data) : false;
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    return false;
  }
};

export const clearOnboardingStatus = async () => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing onboarding status:', error);
    return false;
  }
};

// Combined helper to clear all auth-related data
export const clearAllAuthData = async () => {
  try {
    await clearAuthData();
    await clearOnboardingStatus();
    return true;
  } catch (error) {
    console.error('Error clearing all auth data:', error);
    return false;
  }
};