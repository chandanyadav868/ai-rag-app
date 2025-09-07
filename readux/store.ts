
import { configureStore } from "@reduxjs/toolkit";
import  aiImageReducer from "./slice/aiImageSlice";

const store = configureStore({
    reducer:{
        aiImage:aiImageReducer
    }
})

// extracting types from variable we use typeof , 
// in first we want to put type of RootStore which return by running store.getState methods return value which is above reducer holding value it could be any type,
// in second we want StoreDispatch hold the type which type store["dispatch"] method hold type
export type RootStore = ReturnType<typeof store.getState>
export type StoreDispatch = typeof store.dispatch

export default store