import { NextRequest, NextResponse } from "next/server";
import { ApiErrorRoutes, ApiSuccessRoutes } from "../../register/route";
import crypto from 'crypto';
import mongodbConnection from "@/mongodb/connection";
import Order from "@/mongodb/schema/Order.Schema";
import { log } from "console";

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        console.log('Raw Body:', body);
        
        console.log("Headers:", req.headers);
        
        const razorpaySignature = req.headers.get('x-razorpay-signature');

        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECREAT!).update(body).digest('hex');

        console.log('Razorpay Signature:', razorpaySignature);
        console.log('Expected Signature:', expectedSignature);
        

        if (razorpaySignature !== expectedSignature) {
            return NextResponse.json(
                new ApiErrorRoutes({
                    message: 'Invalid Signature',
                    status: 400,
                    error: "Does not matched Razorpay signature"
                })
            )
        }

        const event = JSON.parse(body);
        console.log('Razorpay Webhook Event:', event);

        await mongodbConnection();

        if (event.event === 'payment.captured') {
            const paymentEntity = event.payload.payment.entity;
            console.log('Payment Captured:', paymentEntity);
            
            const updatedData = await Order.findOneAndUpdate(
                { razorpayOrderId: paymentEntity.order_id },
                { status: 'Success' },
                { new: true }
            );
            
            log('Updated Order:', updatedData);
        }

        return NextResponse.json(new ApiSuccessRoutes({
            message: 'Webhook processed successfully',
            status: 200,
            success: true
        }));

    } catch (error) {
        console.log('Error in order route:', error);
        return NextResponse.json(new ApiErrorRoutes({
            message: 'Internal Server Error',
            status: 500,
            error: error instanceof Error ? error.message : 'Unknown error'
        }))
    }
}