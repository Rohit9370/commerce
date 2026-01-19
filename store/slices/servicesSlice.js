import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../app/services/firebaseconfig";

// Fetch all available services from Firestore
export const fetchAllServices = createAsyncThunk(
  "services/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const servicesRef = collection(db, "services");
      const q = query(servicesRef, where("isActive", "==", true));
      const snapshot = await getDocs(q);

      const services = [];
      snapshot.forEach((doc) => {
        services.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return services;
    } catch (error) {
      console.error("Error fetching services:", error);
      return rejectWithValue(error.message);
    }
  },
);

// Fetch shopkeeper/admin's own services
export const fetchShopServices = createAsyncThunk(
  "services/fetchShop",
  async (shopId, { rejectWithValue }) => {
    try {
      const servicesRef = collection(db, "services");
      const q = query(servicesRef, where("shopId", "==", shopId));
      const snapshot = await getDocs(q);

      const services = [];
      snapshot.forEach((doc) => {
        services.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return services;
    } catch (error) {
      console.error("Error fetching shop services:", error);
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  allServices: [],
  shopServices: [],
  loading: false,
  error: null,
};

const servicesSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All Services
    builder
      .addCase(fetchAllServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllServices.fulfilled, (state, action) => {
        state.loading = false;
        state.allServices = action.payload;
      })
      .addCase(fetchAllServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch services";
      });

    // Fetch Shop Services
    builder
      .addCase(fetchShopServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShopServices.fulfilled, (state, action) => {
        state.loading = false;
        state.shopServices = action.payload;
      })
      .addCase(fetchShopServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch shop services";
      });
  },
});

export const { clearError } = servicesSlice.actions;
export default servicesSlice.reducer;

// Selectors
export const selectAllServices = (state) => state.services.allServices;
export const selectShopServices = (state) => state.services.shopServices;
export const selectServicesLoading = (state) => state.services.loading;
export const selectServicesError = (state) => state.services.error;
