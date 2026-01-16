import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  uid: null,
  email: null,
  role: null, // 'user' | 'shopkeeper' | 'admin' | 'super-admin'
  userData: null,
  ready: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action) {
      const { uid, email, role, userData } = action.payload || {};
      state.uid = uid ?? null;
      state.email = email ?? null;
      state.role = role ?? null;
      state.userData = userData ?? null;
      state.ready = true;
    },
    clearAuth(state) {
      Object.assign(state, initialState);
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
