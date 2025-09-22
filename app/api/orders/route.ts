import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { ApiErrorRoutes, ApiSuccessRoutes } from "../register/route";
import mongodbConnection from "@/mongodb/connection";
import Order from "@/mongodb/schema/Order.Schema";

export const initiate = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!
});

export async function POST(req: NextRequest, res: NextResponse) {
    try {
        const { id, amount } = await req.json();

        if (!id) {
            return NextResponse.json(new ApiErrorRoutes({
                message: 'Aunthentication',
                status: 401,
                error: 'Aunthentication request'
            }))
        }

        await mongodbConnection();
        // Create orderId in Razorpay
        const order = await initiate.orders.create({
            amount: amount * 100,
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`,
            notes: {
                userId: id
            }
        });

        // saving order in database
        const newOrder = await Order.create({
            userId: id,
            razorpayOrderId: order.id,
            amount: order.amount,
            currency: order.currency,
            status: "pending"
        });

        return NextResponse.json({
            ...new ApiSuccessRoutes({
                message: 'Successfully created',
                status: 200,
                success: true
            }), data: { orderId: order.id, amount: order.amount, currency: order.currency, dbOrderId: newOrder.id }
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