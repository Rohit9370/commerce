import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  hasOnboarded: false,
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setOnboarded(state, action) {
      state.hasOnboarded = !!action.payload;
    },
    resetOnboarding(state) {
      state.hasOnboarded = false;
    },
  },
});

export const { setOnboarded, resetOnboarding } = onboardingSlice.actions;
export default onboardingSlice.reducer;