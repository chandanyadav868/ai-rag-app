import { ai } from "@/constant";
import mongodbConnection from "@/mongodb/connection";
import UserSchema from "@/mongodb/schema/User.Schema";
import { Modality, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { ApiErrorRoutes } from "../register/route";



export async function POST(request: NextRequest) {
    try {
        // jo bhi content bheja gya hai from fronend they are present in the content 
        const { content, id, systemPromptSelected } = await request.json();
        // console.log(request);

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
        let promptGeneration;

        try {
            // make api call, comeback with response or error
            promptGeneration = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: content,
                config: {
                    systemInstruction: {
                        role: "system",
                        text: systemPromptSelected
                    },
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                main_subject: { type: Type.STRING },
                                action_context: { type: Type.STRING },
                                detailed_description: { type: Type.STRING },
                                artistic_style: { type: Type.STRING },
                                mood: { type: Type.STRING },
                                lighting: { type: Type.STRING },
                                composition: { type: Type.STRING },
                                color_palette: { type: Type.STRING },
                                quality_enhancers: { type: Type.STRING },
                                negative_prompts: { type: Type.STRING }
                            },
                            propertyOrdering: [
                                "main_subject",
                                "action_context",
                                "detailed_description",
                                "artistic_style",
                                "mood",
                                "lighting",
                                "composition",
                                "color_palette",
                                "quality_enhancers",
                                "negative_prompts"
                            ]
                        }
                    }

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

        // console.log("promtGeneration:- ", promtGeneration);
        const promptData = promptGeneration?.text
        if (!promptData) {
            return NextResponse.json(new ApiErrorRoutes({ error: "Api Not response as Expected", message: "No image created", status: 400 }))
        }

        const updatingDataBase = await UserSchema.findOneAndUpdate({ _id: id }, { $inc: { credit: -1 } }, { new: true }) as UserSchemaProp | null;

        if (!updatingDataBase) {
            return NextResponse.json(new ApiErrorRoutes({ error: "User not found updating time", message: "Server Error", status: 400 }))
        }


        console.log("updatingUserData:- ", updatingDataBase)

        data["text"] = promptData
        data["credit"] = updatingDataBase.credit
        // return buffer; // Return the image buffer


        return NextResponse.json({ status: 200, message: "Successfully", data: data })
        // {"error":{"code":503,"message":"The model is overloaded. Please try again later.","status":"UNAVAILABLE"}}


    } catch (error) {
        const errorImage = error as { message: string, stack: string }
        console.log("error in route.ts", errorImage?.message);
        return NextResponse.json(errorImage.message)
    }
}