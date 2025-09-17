import { NextRequest, NextResponse } from "next/server";
import { ApiErrorRoutes,ApiSuccessRoutes } from "../register/route";
import mongodbConnection from "@/mongodb/connection";
import UserSchema from "@/mongodb/schema/User.Schema";
// ⬇️ Import DB code here, not at top-level


export async function POST(req: NextRequest) {
    try {
        const credentials = await req.json();
        console.log("credentials",credentials);
        
        const userData = await mongodbConnection();
        const responseData = await UserSchema.findOne({ email: credentials.email }).lean() as UserSchemaProp | null;

        // console.log("response in the apiendpoint of mongoose.ts:- ", responseData);
        

        return NextResponse.json({ ...responseData })

    } catch (error) {
        return NextResponse.json(new ApiErrorRoutes({
            error: JSON.stringify(error),
            message: "Server Error in User Fetching",
            status: 500
        }))
    }
}