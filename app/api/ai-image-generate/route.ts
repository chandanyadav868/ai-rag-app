import { ai } from "@/constant";
import UserSchema from "@/mongodb/schema/User.Schema";
import { Modality } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        // jo bhi content bheja gya hai from fronend they are present in the content 
        const { content, id } = await request.json();
        console.log(request);

        console.log("id:- ", id);
        if (!id) {
            return NextResponse.json({ status: 400, error: { error: "Server error", message: "Did not get user Id" }, data: [] })
        }



        const existingUser = await UserSchema.findOne({ _id: id, }) as UserSchemaProp | null;

        if (!existingUser) {
            return NextResponse.json({ status: 400, error: { error: "User not found", message: "User not found  please login again" }, data: [] })
        }

        if (!existingUser.credit || (existingUser.credit && existingUser?.credit < 1)) {
            return NextResponse.json({ status: 400, error: { error: "Your Credit is exhausted", message: "Credit exhausted by you please top up" }, data: [] })
        }

        
        const data: Record<string, string | Buffer<ArrayBuffer>> = {};
        
        // ye method gemina ke api ko call karta hai, with object body
        const imageGeneration = await ai.models.generateContent({
            model: "gemini-2.0-flash-preview-image-generation",
            contents: content,
            // config batata hai ki, kya aapko dena hai response mai, image and text
            config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE]
            }
        });
        
        console.log("imageGeneration:- ", imageGeneration);
        const imageData = imageGeneration.data
        if (!imageData) {
            return NextResponse.json({ status: 400, error: { error: "Api Not response as Expected", message: "No image created" }, data: [] })
        }
        
        const updatingDataBase = await UserSchema.findOneAndUpdate({_id:id}, {$inc : {credit: -1}},{new:true})
        console.log("updatingUserData:- ", updatingDataBase);

    const buffer = Buffer.from(imageData, "base64")
    console.log("buffer:- ", buffer);
    data["data"] = buffer
    // return buffer; // Return the image buffer


    return NextResponse.json({ status: 200, message: "Successfully", data: data })
    // {"error":{"code":503,"message":"The model is overloaded. Please try again later.","status":"UNAVAILABLE"}}


} catch (error) {
    const errorImage = error as { message: string, stack: string }
    console.log("error in route.ts", errorImage?.message);

    return NextResponse.json({ status: 500, error: { error: errorImage?.message, message: "Something went wrong in function running" }, data: [] })
}
}