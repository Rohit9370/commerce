import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const ONBOARDING_STORAGE_KEY = "onboarding_completed";

// Async thunk for completing onboarding
export const completeOnboarding = createAsyncThunk(
  "onboarding/complete",
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Async thunk for resetting onboarding
export const resetOnboardingStatus = createAsyncThunk(
  "onboarding/reset",
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
      return false;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  hasOnboarded: false,
  currentStep: 0,
  totalSteps: 3,
  loading: false,
  error: null,
};

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    setOnboardingStart(state) {
      state.loading = true;
      state.error = null;
    },
    setOnboarded(state, action) {
      state.hasOnboarded = !!action.payload;
      state.loading = false;
      state.error = null;
    },
    setCurrentOnboardingStep(state, action) {
      state.currentStep = action.payload;
    },
    resetOnboarding(state) {
      state.hasOnboarded = false;
      state.currentStep = 0;
      state.loading = false;
      state.error = null;
    },
    setOnboardingError(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    setOnboardingComplete(state) {
      state.hasOnboarded = true;
      state.currentStep = state.totalSteps;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Complete Onboarding
    builder
      .addCase(completeOnboarding.pending, (state) => {
        state.loading = true;
      })
      .addCase(completeOnboarding.fulfilled, (state) => {
        state.hasOnboarded = true;
        state.currentStep = state.totalSteps;
        state.loading = false;
        state.error = null;
      })
      .addCase(completeOnboarding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Reset Onboarding
    builder
      .addCase(resetOnboardingStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(resetOnboardingStatus.fulfilled, (state) => {
        state.hasOnboarded = false;
        state.currentStep = 0;
        state.loading = false;
        state.error = null;
      })
      .addCase(resetOnboardingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setOnboardingStart,
  setOnboarded,
  setCurrentOnboardingStep,
  resetOnboarding,
  setOnboardingError,
  setOnboardingComplete,
} = onboardingSlice.actions;
export default onboardingSlice.reducer;
