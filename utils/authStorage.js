import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = 'user_auth_data';
const ONBOARDING_STORAGE_KEY = 'onboarding_completed';

// Auth helpers
export const saveAuthData = async (authData) => {
  try {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  } catch (error) {
    console.error('Error saving auth data:', error);
  }
};

export const getAuthData = async () => {
  try {
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
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

// Onboarding helpers
export const saveOnboardingStatus = async (completed) => {
  try {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(completed));
  } catch (error) {
    console.error('Error saving onboarding status:', error);
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
  } catch (error) {
    console.error('Error clearing onboarding status:', error);
  }
};