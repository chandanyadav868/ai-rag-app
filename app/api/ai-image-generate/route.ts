import { ai } from "@/constant";
import { Modality } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        // jo bhi content bheja gya hai from fronend they are present in the content 
        const content = await request.json();
        console.log("content:- ", content);

        const data:Record<string,string | Buffer<ArrayBuffer>>  = {};

        // ye method gemina ke api ko call karta hai, with object body
        const imageGeneration = await ai.models.generateContent({
            model: "gemini-2.0-flash-preview-image-generation",
            contents: content,
            // config batata hai ki, kya aapko dena hai response mai, image and text
            config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE]
            }
        });

        // ye typesafety ke liye check karta hai
        if (!imageGeneration?.candidates?.[0].content?.parts) {
            console.log("Response Data undefined");
            return
        }

        console.log("imageGeneration:- ", imageGeneration);

        // ye for loop aap ke response mai ,se image ka buffer data, ya text ka data nikalata hai
        for (const part of imageGeneration?.candidates[0]?.content?.parts) {
            if (part.text) {
                console.log(part.text);
                // i am setting a property key in the data name with text
                data["text"] = part.text
            } else if (part.inlineData) {
                const imageData = part.inlineData.data;

                if (!imageData) {
                    throw new Error("Image data is Empty please try again")
                }

                const buffer = Buffer.from(imageData, "base64")
                console.log("buffer:- ",buffer);
                data["buffer"] = buffer
                // return buffer; // Return the image buffer
            }
        }

        return NextResponse.json({ status: 200, message: "Successfully", data:data })

    } catch (error) {
        const errorImage = error as {message:string,stack:string}
        console.log("error in route.ts",errorImage?.message);
        
        return NextResponse.json({ status: 500, error: {error:errorImage?.message,message:"Something went wrong in function running"}, data: [] })
    }
}