import mongodbConnection from "@/mongodb/connection";
import { NextRequest, NextResponse } from "next/server";
import { ApiErrorRoutes } from "../register/route";
import { feedbackFormSchema } from "@/mongodb/schema/Feedback.Schema";
import UserSchema from "@/mongodb/schema/User.Schema";

export async function POST(req: NextRequest) {
    try {
        const { feedback, id } = await req.json();
        console.log(feedback, id);

        await mongodbConnection();

        if (!id) {
            return NextResponse.json(new ApiErrorRoutes({ error: "Server error", message: "Please login", status: 400 }))
        };

        const existingUser = await UserSchema.findById(id).lean();
        console.log(existingUser);


        if (!existingUser) {
            return NextResponse.json(new ApiErrorRoutes({ error: "User not found", message: "User not found", status: 404 }))
        }

        const createdFeedback = await feedbackFormSchema.create({
            createdBy: id, feedback
        });
        console.log('createdFeedback:- ', createdFeedback);

        const searchingFeedback = await feedbackFormSchema.findById(createdFeedback._id).populate('createdBy', 'email _id');
        console.log('searchingFeedback:- ', searchingFeedback);

        return NextResponse.json({ status: 200, message: "Successfully", data: searchingFeedback })

    } catch (error) {
        const errorImage = error as { message: string, stack: string }
        console.log("error in route.ts", errorImage?.message);
        return NextResponse.json(new ApiErrorRoutes({ error: "Server Error", message: errorImage.message, status: 500 }))
    }
}


export async function GET(req: NextRequest) {
    try {
        const searchingFeedback = await feedbackFormSchema.find({}).limit(20).sort({ createdAt: -1 }).populate('createdBy', 'email _id avatar username');   
        console.log('searchingFeedback:- ', searchingFeedback);

        return NextResponse.json({ status: 200, message: "Successfully", data: searchingFeedback })

    } catch (error) {
        const errorImage = error as { message: string, stack: string }
        console.log("error in route.ts", errorImage?.message);
        return NextResponse.json(new ApiErrorRoutes({ error: "Server Error", message: errorImage.message, status: 500 }))
    }

}