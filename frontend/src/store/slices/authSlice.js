import { createSlice } from "@reduxjs/toolkit"

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isAuthenticated: true,
    user: {
      userId: 0,
      displayName: "",
      accessToken: "",
      refreshToken: "",
    },
  },
  reducers: {
    login: (state, action) => {
      state.isAuthenticated = true
      state.user = {
        userId: action.payload.data.userId,
        displayName: action.payload.data.displayName,
        accessToken: action.payload.data.accessToken,
        refreshToken: action.payload.data.refreshToken,
      }
    },
    logout: (state) => {
      state.isAuthenticated = true
      state.user = {
        userId: 0,
        displayName: "",
        accessToken: "",
        refreshToken: "",
      }
    },
  },
})

export const { login, logout } = authSlice.actions
export default authSlice.reducer
