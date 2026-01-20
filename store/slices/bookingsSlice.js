import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from "firebase/firestore";
import { db } from "../../app/services/firebaseconfig";
import { convertTimestamps } from "../../utils/firestoreConverter";

// Fetch bookings for a shopkeeper
export const fetchShopkeeperBookings = createAsyncThunk(
  "bookings/fetchShopkeeper",
  async (shopId, { rejectWithValue }) => {
    try {
      const bookingsRef = collection(db, "bookings");
      const q = query(bookingsRef, where("shopId", "==", shopId));
      const snapshot = await getDocs(q);

      const bookings = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...convertTimestamps(data),
        });
      });

      return bookings;
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return rejectWithValue(error.message);
    }
  },
);

// Fetch user bookings
export const fetchUserBookings = createAsyncThunk(
  "bookings/fetchUser",
  async (userId, { rejectWithValue }) => {
    try {
      const bookingsRef = collection(db, "bookings");
      const q = query(bookingsRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);

      const bookings = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...convertTimestamps(data),
        });
      });

      return bookings;
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      return rejectWithValue(error.message);
    }
  },
);

// Create a new booking
export const createBooking = createAsyncThunk(
  "bookings/create",
  async (bookingData, { rejectWithValue }) => {
    try {
      console.log('Creating booking with data:', bookingData);
      const bookingRef = doc(collection(db, "bookings"));
      const dataToSave = {
        ...bookingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(bookingRef, dataToSave);
      
      console.log('Booking created with ID:', bookingRef.id);
      
      // Return the booking data with the new ID and converted timestamps
      return convertTimestamps({ 
        id: bookingRef.id, 
        ...bookingData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      return rejectWithValue(error.message);
    }
  },
);

// Update booking status
export const updateBookingStatus = createAsyncThunk(
  "bookings/updateStatus",
  async ({ bookingId, status }, { rejectWithValue }) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      return { bookingId, status };
    } catch (error) {
      console.error("Error updating booking:", error);
      return rejectWithValue(error.message);
    }
  },
);

// Confirm booking
export const confirmBooking = createAsyncThunk(
  "bookings/confirm",
  async (bookingId, { rejectWithValue }) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: "confirmed",
        confirmedAt: new Date(),
      });
      return { bookingId, status: "confirmed" };
    } catch (error) {
      console.error("Error confirming booking:", error);
      return rejectWithValue(error.message);
    }
  },
);

// Cancel booking
export const cancelBooking = createAsyncThunk(
  "bookings/cancel",
  async (bookingId, { rejectWithValue }) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: "cancelled",
        cancelledAt: new Date(),
      });
      return { bookingId, status: "cancelled" };
    } catch (error) {
      console.error("Error cancelling booking:", error);
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  shopkeeperBookings: [],
  userBookings: [],
  loading: false,
  error: null,
};

const bookingsSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Shopkeeper Bookings
    builder
      .addCase(fetchShopkeeperBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShopkeeperBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.shopkeeperBookings = action.payload;
      })
      .addCase(fetchShopkeeperBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch bookings";
      });

    // Fetch User Bookings
    builder
      .addCase(fetchUserBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.userBookings = action.payload;
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch bookings";
      })
      
      // Create Booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        // Add the new booking to the user bookings
        state.userBookings.push(action.payload);
        
        // Also add to shopkeeper bookings if the shopkeeper is viewing
        state.shopkeeperBookings.push(action.payload);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create booking";
      });

    // Update Booking Status
    builder
      .addCase(updateBookingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.loading = false;
        const { bookingId, status } = action.payload;

        const shopIndex = state.shopkeeperBookings.findIndex(
          (b) => b.id === bookingId,
        );
        if (shopIndex > -1) {
          state.shopkeeperBookings[shopIndex].status = status;
        }

        const userIndex = state.userBookings.findIndex(
          (b) => b.id === bookingId,
        );
        if (userIndex > -1) {
          state.userBookings[userIndex].status = status;
        }
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update booking";
      })
      
      // Confirm Booking
      .addCase(confirmBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmBooking.fulfilled, (state, action) => {
        state.loading = false;
        const { bookingId, status } = action.payload;

        const shopIndex = state.shopkeeperBookings.findIndex(
          (b) => b.id === bookingId,
        );
        if (shopIndex > -1) {
          state.shopkeeperBookings[shopIndex].status = status;
        }

        const userIndex = state.userBookings.findIndex(
          (b) => b.id === bookingId,
        );
        if (userIndex > -1) {
          state.userBookings[userIndex].status = status;
        }
      })
      .addCase(confirmBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to confirm booking";
      })
      
      // Cancel Booking
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        const { bookingId, status } = action.payload;

        const shopIndex = state.shopkeeperBookings.findIndex(
          (b) => b.id === bookingId,
        );
        if (shopIndex > -1) {
          state.shopkeeperBookings[shopIndex].status = status;
        }

        const userIndex = state.userBookings.findIndex(
          (b) => b.id === bookingId,
        );
        if (userIndex > -1) {
          state.userBookings[userIndex].status = status;
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to cancel booking";
      });
  },
});

export const { clearError } = bookingsSlice.actions;
export default bookingsSlice.reducer;

// Selectors
export const selectShopkeeperBookings = (state) =>
  state.bookings.shopkeeperBookings;
export const selectUserBookings = (state) => state.bookings.userBookings;
export const selectBookingsLoading = (state) => state.bookings.loading;
export const selectBookingsError = (state) => state.bookings.error;
