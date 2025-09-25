import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { ApiErrorRoutes, ApiSuccessRoutes } from "../register/route";
import mongodbConnection from "@/mongodb/connection";
import Order from "@/mongodb/schema/Order.Schema";
import PriceSchema, { PriceSchemaProps } from "@/mongodb/schema/Price.Schema";

const initiate = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!
});

export async function POST(req: NextRequest, res: NextResponse) {
    try {
        const { id, amount } = await req.json();

        console.log(id, typeof amount);

        if (!id) {
            return NextResponse.json(new ApiErrorRoutes({
                message: 'Aunthentication',
                status: 401,
                error: 'Aunthentication request'
            }))
        }

        await mongodbConnection();

        // Price Data
        const priceData = await PriceSchema.findOne({ rate: amount }).lean() as PriceSchemaProps | null;
        console.log("priceData:- ", priceData);

        if (!priceData) {
            return NextResponse.json(new ApiErrorRoutes({
                error: "No Price Found",
                message: "Price is Not Correct",
                status: 400
            }))
        }

        let order = null;
        // Create orderId in Razorpay
        try {
            order = await initiate.orders.create({
                amount: amount * 100,
                currency: 'INR',
                receipt: `receipt_order_${Date.now()}`,
                notes: {
                    userId: id,
                    plan: priceData.type,
                    credits: priceData.credits
                }
            });

            console.log("Razorpay Order:", order);
        } catch (error) {
            console.log('Error in creating Order from Razorpay:', error);
            return NextResponse.json(new ApiErrorRoutes({
                message: (error as any).error.description,
                status: (error as any).statusCode,
                error: (error as any).error.code
            }))
        }


        // saving order in database
        const newOrder = await Order.create({
            userId: id,
            razorpayOrderId: order?.id,
            amount: order?.amount,
            currency: order?.currency,
            status: "pending"
        });

        return NextResponse.json({
            ...new ApiSuccessRoutes({
                message: 'Successfully created',
                status: 200,
                success: true
            }), data: { orderId: order?.id, amount: order?.amount, currency: order?.currency, dbOrderId: newOrder.id }
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