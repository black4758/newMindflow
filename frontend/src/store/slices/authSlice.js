import { createSlice } from "@reduxjs/toolkit"

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isAuthenticated: false,
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
        id: action.payload.data.id,
        nickname: action.payload.data.nickname,
        accessToken: action.payload.data["access token"],
        refreshToken: action.payload.data["refresh token"],
      }
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.user = {
        id: 0,
        nickname: "",
        accessToken: "",
        refreshToken: "",
      }
    },
  },
})

export const { login, logout } = authSlice.actions
export default authSlice.reducer
