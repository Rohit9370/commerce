import { createSlice, nanoid } from '@reduxjs/toolkit';

const initialState = {
  items: [], // {id, title, body, data, createdAt, read}
  unread: 0,
  pushToken: null,
};

const slice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: {
      reducer(state, action) {
        state.items.unshift(action.payload);
        state.unread += 1;
      },
      prepare({ title, body, data }) {
        return {
          payload: {
            id: nanoid(),
            title,
            body,
            data: data || null,
            createdAt: Date.now(),
            read: false,
          },
        };
      },
    },
    markAllRead(state) {
      state.items = state.items.map((n) => ({ ...n, read: true }));
      state.unread = 0;
    },
    setPushToken(state, action) {
      state.pushToken = action.payload || null;
    },
    clear(state) {
      Object.assign(state, initialState);
    },
  },
});

export const { addNotification, markAllRead, setPushToken, clear } = slice.actions;
export default slice.reducer;
