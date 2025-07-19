import { fileReading } from "@/utils/util";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req:NextRequest) {
    try {
        const pdfUploadData = await fileReading();
        return NextResponse.json({status:200,message:"Successfully got data",data:pdfUploadData})
    } catch (error) {
        console.log("Error in routes:- ", error);
        
        return NextResponse.json({status:500,message:"Successfully got data",error:error})
        
    }
}