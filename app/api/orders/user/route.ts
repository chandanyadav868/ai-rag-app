import { NextRequest, NextResponse } from "next/server";
import { ApiErrorRoutes, ApiSuccessRoutes } from "../../register/route";
import mongodbConnection from "@/mongodb/connection";
import Order from "@/mongodb/schema/Order.Schema";

export async function GET(req: NextRequest) {
    try {
        const { id } = await req.json();
        if (!id) {
            return NextResponse.json(new ApiErrorRoutes({
                message: 'Aunthentication',
                status: 401,
                error: 'Aunthentication request'
            }))
        }

        await mongodbConnection();
        const orders = await Order.find({ userId: id }).sort({ createdAt: -1 }).lean();

        return NextResponse.json({
            ...new ApiSuccessRoutes({
                message: 'Successfully created',
                status: 200,
                success: true
            }), data: orders
        })

    } catch (error) {
        console.log('Error in order route:', error);
        return NextResponse.json(new ApiErrorRoutes({
            message: 'Internal Server Error',
            status: 500,
            error: error instanceof Error ? error.message : 'Unknown error'
        }))
    }
}