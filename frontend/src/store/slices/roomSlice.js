import { createSlice } from "@reduxjs/toolkit"

const chatRoomSlice = createSlice({
    name: "chatRoom",
    initialState: {
        currentChatRoom: null
    },
    reducers: {
        setCurrentChatRoom: (state, action) => {
            state.currentChatRoom = action.payload;
            console.log(state.currentChatRoom)
        },
        resetCurrentChatRoom: (state) => {
            state.currentChatRoom = null;
        },
    },
});

export const { setCurrentChatRoom, resetCurrentChatRoom } = chatRoomSlice.actions;
export default chatRoomSlice.reducer;
