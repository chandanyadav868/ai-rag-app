import { ai } from "@/constant";
import mongodbConnection from "@/mongodb/connection";
import UserSchema from "@/mongodb/schema/User.Schema";
import { Modality } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { ApiErrorRoutes } from "../register/route";



export async function POST(request: NextRequest) {
    try {
        // jo bhi content bheja gya hai from fronend they are present in the content 
        const { content, id, model } = await request.json();
        // console.log(request);

        console.log("id:- ", id, "model:- ", model, 'content:- ', content);

        if (!id) {
            return NextResponse.json(new ApiErrorRoutes({ error: "Server error", message: "Please login", status: 400 }))
        }

        await mongodbConnection();
        const existingUser = await UserSchema.findOne({ _id: id }) as UserSchemaProp | null;

        if (!existingUser) {
            return NextResponse.json(new ApiErrorRoutes({ error: "User not found", message: "User not found", status: 404 }))
        }

        if (!existingUser.credit || (existingUser.credit && existingUser?.credit < 1)) {
            return NextResponse.json(new ApiErrorRoutes({ error: "You exceeded your current quota", message: "RESOURCE_EXHAUSTED", status: 429 }))
        }

        const data: Record<string, string | number | undefined | Buffer<ArrayBuffer>> = {};

        // ye method gemina ke api ko call karta hai, with object body
        let imageGeneration;

        // const modelList = await ai.models.list();

        try {
            imageGeneration = await ai.models.generateContent({
                model: model,
                contents: content,
                // config batata hai ki, kya aapko dena hai response mai, image and text
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                }
            });
        } catch (error) {
            const errorJson = error as { message: any, stack: string }
            const Geminaerror = JSON.parse(errorJson.message as any);
            console.log("Geminaerror:- ", Geminaerror);

            return NextResponse.json(new ApiErrorRoutes({
                error: Geminaerror.error.status,
                message: Geminaerror.error.message,
                status: Geminaerror.error.code
            }))
        }

        // console.log("imageGeneration:- ", imageGeneration);
        const imageData = imageGeneration?.data;
        const imagetext = imageGeneration?.text;
        if (!imageData) {
            return NextResponse.json(new ApiErrorRoutes({ error: "Api Not response as Expected", message: "No image created", status: 400 }))
        }

        const updatingDataBase = await UserSchema.findOneAndUpdate({ _id: id }, { $inc: { credit: -1 } }, { new: true }) as UserSchemaProp | null;

        if (!updatingDataBase) {
            return NextResponse.json(new ApiErrorRoutes({ error: "User not found updating time", message: "Server Error", status: 400 }))
        }

        // console.log("updatingUserData:- ", updatingDataBase) 

        const buffer = Buffer.from(imageData, "base64")
        // console.log("buffer:- ", buffer);
        data["data"] = buffer
        data["credit"] = updatingDataBase.credit
        data["text"] = imagetext
        // data["model"] = modelList as unknown as string
        // return buffer; // Return the image buffer

        return NextResponse.json({ status: 200, message: "Successfully", data: data })
        // {"error":{"code":503,"message":"The model is overloaded. Please try again later.","status":"UNAVAILABLE"}}

    } catch (error) {
        const errorImage = error as { message: string, stack: string }
        console.log("error in route.ts", errorImage?.message);
        return NextResponse.json(errorImage.message)
    }
}