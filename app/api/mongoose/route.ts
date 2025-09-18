import { NextRequest, NextResponse } from "next/server";
import { ApiErrorRoutes, ApiSuccessRoutes } from "../register/route";
import mongodbConnection from "@/mongodb/connection";
import UserSchema from "@/mongodb/schema/User.Schema";
import { tree } from "next/dist/build/templates/app-page";
// ⬇️ Import DB code here, not at top-level


export async function POST(req: NextRequest) {
    try {
        const credentials = await req.json();
        console.log("credentials", credentials);

        const userData = await mongodbConnection();
        const responseData = await UserSchema.findOne({ email: credentials.email }).select('-password -__v').lean() as UserSchemaProp | null;

        // console.log("response in the apiendpoint of mongoose.ts:- ", responseData);


        return NextResponse.json({
            ...new ApiSuccessRoutes({message:'Successfully',status:200,success:true}),data:{ ...responseData,id:responseData?._id}})

    } catch (error) {
        const errorObject = error as { message: string, name: string }
        return NextResponse.json(new ApiErrorRoutes({
            error: JSON.stringify(error),
            message: errorObject.message,
            status: 500
        }))
    }
}