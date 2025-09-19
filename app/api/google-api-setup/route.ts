import { GoogleGenAI } from "@google/genai";
import { NextRequest,NextResponse } from "next/server";
import { ApiErrorRoutes, ApiSuccessRoutes } from "../register/route";
import { ai } from "@/constant";

export async function POST(request:NextRequest){
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        
        const apiKey = process.env.GOOGLE_GEMINA_API;
        if(!apiKey || apiKey===""){
            return NextResponse.json(new ApiErrorRoutes({error:"Error",message:"Please setup your google api key from settings",status:400}))
        }

        const googleApiSetUp = await ai.files.upload({
            file: file,
        });

        if(!googleApiSetUp){
            return NextResponse.json(new ApiErrorRoutes({error:"Error",message:"Please setup your google api key from settings",status:400}))
        }        
        
        return NextResponse.json(
            {...new ApiSuccessRoutes({ message: "Successfully created User", status: 200, success: true }),data:googleApiSetUp})

    } catch (error) {
         return NextResponse.json(new ApiErrorRoutes({ error: JSON.stringify(error), message: "Server Error", status: 500 }))
    }
}