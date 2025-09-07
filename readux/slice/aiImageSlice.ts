"use client"
import { Content } from "@google/genai"
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { Canvas } from "fabric"

interface IntialState {
    canvasFabricjs:Canvas | null
    image: Record<string, string | Array<Buffer<ArrayBuffer>>>[],
    status: null | string,
    error: string | undefined
}

const initialState: IntialState = {
    canvasFabricjs:null, // this canvas will be attached fabric canvas intialised methods
    image: [],
    status: null,
    error: undefined
}

// this interface is for what can return if asyncThunk fullfield
interface ApiAiImageGenerateProp {
    status: number;
    message: string;
    data: Record<string, string | Array<Buffer<ArrayBuffer>>>
}

// this interface is for what can retrun if asyncThunk reject
interface ApiError {
     status:number,
     data:{},
     error:{
        error:string,
        message:string
     }
}

// for async we need of making a createThunk methods call
// first type is for successfull api response, second is for parameter which can be set, 
export const aiImageGenerate = createAsyncThunk<ApiAiImageGenerateProp, Content, {rejectValue:ApiError}>("aiImagegenerate",
    // first parameter of async fn is the first argument,
    async (content,thunkApi) => {
        try {
            console.log("content in aiImageSlice:- ", content);

            const response = await fetch("/api/ai-image-generate", {
                method: "POST",
                body: JSON.stringify(content)
            });

            const jsonConvert = await response.json();
            console.log(jsonConvert);

            // jab status 400 or 400 ke upar rahata hai to eska matlab kuchh error aa rha hai to backend se jo error aaya hai use send kar do, 
            if (jsonConvert.status >= 400) {
                return thunkApi.rejectWithValue({
                status:500,
                data:{},
                error:{
                    error:jsonConvert.error.error,
                    message:jsonConvert.error.message
                }
            })
            }

            // this is for canverting Buffer of ArrayBuffer into the url of string
            let tempUrlMedia ;
            if (jsonConvert.data.buffer.type === "Buffer") {                
                // blob take buffer value and save them temporaly in memory with the help of Blob
                const blob = new Blob([jsonConvert.data.buffer.data], { type: "image/png" });
                console.log("blob",blob);
                // URL.createObjectURL take that BLob and make it as url which can be accessed
                tempUrlMedia = URL.createObjectURL(blob);
            }

            return {
                status:jsonConvert.status,
                message:jsonConvert.message,
                data:{
                    ...jsonConvert["data"],
                    buffer:tempUrlMedia,
                    aiGenerated:true
                }
            }

        } catch (error) {
            console.log("Error in aiImageGenerate aiImageSlice.ts:- ", error);
             return thunkApi.rejectWithValue({
                status:500,
                data:{},
                error:{
                    error:"",
                    message:"Something went wrong"
                }
            })
        }
    }
)

const aiImageSlice = createSlice({
    name: "aiImage",
    initialState,
    reducers: {
        addImage: (state, action) => {
            console.log(console.log(state, action))
            state.image.push(action.payload.image)
        },
        canvasSetUp:(state,action)=>{
            state.canvasFabricjs = action.payload.canvas
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(aiImageGenerate.pending, (state, action) => {
                state.status = "Pending",
                state.error = undefined
            })
            .addCase(aiImageGenerate.fulfilled, (state, action) => {
                state.status = "fullfield";
                console.log("aiImageGenerate.fullfield", action.payload);
                state.image.push(action.payload.data)
            })
            .addCase(aiImageGenerate.rejected, (state, action) => {
                state.status = "rejected",
                console.log("aiImageGenerate.rejected", action.payload);
                if (action.payload) {
                    state.error = action.payload.error.error
                }
            })
    }
},
)

export const { addImage,canvasSetUp } = aiImageSlice.actions

export default aiImageSlice.reducer