import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
    GoogleAuthProvider,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../app/services/firebaseconfig";
import { convertTimestamps } from "../../utils/firestoreConverter";

// Async thunk for restoring session from persisted state
// OPTIMIZED: Returns immediately from Redux cache, Firebase verification in background
export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { rejectWithValue, getState }) => {
    try {
      // Check if auth is already in Redux state (from PersistGate hydration)
      const state = getState();
      const persistedAuth = state.auth;

      // If we already have persisted auth data, use it immediately
      if (persistedAuth?.uid) {
        // Check if userData contains non-serializable values
        try {
          JSON.stringify(persistedAuth.userData);
          // Return cached data instantly - don't wait for Firebase
          return {
            uid: persistedAuth.uid,
            email: persistedAuth.email,
            role: persistedAuth.role,
            userData: persistedAuth.userData,
            fromCache: true, // Flag indicates cached data
          };
        } catch (serializeError) {
          console.log('Cached data contains non-serializable values, fetching fresh data');
          // Continue to fetch fresh data from Firebase
        }
      }

      // No cached auth - try Firebase (first time or after logout)
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return null;
      }

      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const rawUserData = userDoc.exists() ? userDoc.data() : null;
      const userData = rawUserData ? convertTimestamps(rawUserData) : null;

      return {
        uid: currentUser.uid,
        email: currentUser.email,
        role: userData?.role || "user",
        userData: userData || {
          uid: currentUser.uid,
          email: currentUser.email,
        },
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Async thunk for login with email and password
export const loginWithEmail = createAsyncThunk(
  "auth/loginWithEmail",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      const rawUserData = userDoc.exists() ? userDoc.data() : null;
      const userData = rawUserData ? convertTimestamps(rawUserData) : null;

      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role: userData?.role || "user",
        userData: userData || {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
        },
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Async thunk for Google login
export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async ({ idToken }, { rejectWithValue }) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);

      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      const rawUserData = userDoc.exists() ? userDoc.data() : null;
      const userData = rawUserData ? convertTimestamps(rawUserData) : null;

      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role: userData?.role || "user",
        userData: userData || {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
        },
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      // Sign out from Firebase
      await signOut(auth);

      // Clear all AsyncStorage data
      await AsyncStorage.removeItem("user_auth_data");
      await AsyncStorage.removeItem("session_expiry");
      await AsyncStorage.removeItem("onboarding_completed");

      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  uid: null,
  email: null,
  role: null,
  userData: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  ready: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthStart(state) {
      state.loading = true;
      state.error = null;
    },
    setAuthSuccess(state, action) {
      const { uid, email, role, userData } = action.payload || {};
      state.uid = uid ?? null;
      state.email = email ?? null;
      state.role = role ?? null;
      state.userData = userData ?? null;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      state.ready = true;
    },
    setAuthFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.ready = true;
    },
    setAuth(state, action) {
      const { uid, email, role, userData } = action.payload || {};
      state.uid = uid ?? null;
      state.email = email ?? null;
      state.role = role ?? null;
      state.userData = userData ?? null;
      state.isAuthenticated = !!uid;
      state.loading = false;
      state.error = null;
      state.ready = true;
    },
    clearAuth(state) {
      Object.assign(state, initialState);
    },
    updateUserData(state, action) {
      state.userData = { ...state.userData, ...action.payload };
    },
    updateAuthRole(state, action) {
      state.role = action.payload;
    },
    setAuthReady(state, action) {
      state.ready = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Restore Session
    builder
      .addCase(restoreSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        if (action.payload) {
          const { uid, email, role, userData } = action.payload;
          state.uid = uid;
          state.email = email;
          state.role = role;
          state.userData = userData;
          state.isAuthenticated = true;
        }
        state.loading = false;
        state.ready = true;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isAuthenticated = false;
        state.loading = false;
        state.ready = true;
      });

    // Login with Email
    builder
      .addCase(loginWithEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        const { uid, email, role, userData } = action.payload;
        state.uid = uid;
        state.email = email;
        state.role = role;
        state.userData = userData;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // Login with Google
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        const { uid, email, role, userData } = action.payload;
        state.uid = uid;
        state.email = email;
        state.role = role;
        state.userData = userData;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        Object.assign(state, initialState);
        state.ready = true;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setAuthStart,
  setAuthSuccess,
  setAuthFailure,
  setAuth,
  clearAuth,
  updateUserData,
  updateAuthRole,
  setAuthReady,
} = authSlice.actions;
export default authSlice.reducer;
