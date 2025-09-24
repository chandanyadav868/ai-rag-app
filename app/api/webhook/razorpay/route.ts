import { NextRequest, NextResponse } from "next/server";
import { ApiErrorRoutes, ApiSuccessRoutes } from "../../register/route";
import crypto from 'crypto';
import mongodbConnection from "@/mongodb/connection";
import Order from "@/mongodb/schema/Order.Schema";
import Razorpay from "razorpay";
import UserSchema from "@/mongodb/schema/User.Schema";

const initiate = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!
});


export async function POST(req: NextRequest) {
    try {
        // const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();
        // const payment = await initiate.payments.fetch(razorpay_payment_id);
        // console.log("Payment details:", payment);


        const body = await req.text();
        console.log('Raw Body:', body);

        console.log("Headers:", req.headers);

        const razorpaySignature = req.headers.get('x-razorpay-signature');

        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!).update(body).digest('hex');

        console.log('Razorpay Signature:- ', razorpaySignature);
        console.log('Expected Signature:- ', expectedSignature);


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

        let userUpdate = null;

        if (event.event === 'payment.captured') {
            const paymentEntity = event.payload.payment.entity;
            console.log('Payment Captured:', paymentEntity);

            // findOneAnd Update, take three object , first object is for the filtering condition the document, and second is the update what have to be update in field, third is for the returning updated document if new is true
            const updatedData = await Order.findOneAndUpdate(
                { razorpayOrderId: paymentEntity.order_id },
                { status: 'Success', paymentDetails: paymentEntity,     razorpayPaymentId: paymentEntity.id },
                { new: true }
            );

            console.log('Updated Order:', updatedData);

            // this is also doing update after filtring but is doing in different ways, second object use the operator for updating, $set is used for update the field value with new, $inc is increase the value of previous by adding new value,
            userUpdate = await UserSchema.findOneAndUpdate({ _id: paymentEntity.notes.userId },
                {
                    $set: { plan: paymentEntity.notes.plan },
                    $inc: { credit: paymentEntity.notes.credits }
                }, { new: true }).lean();

            console.log('Updated User:', userUpdate);
        }

        return NextResponse.json(new ApiSuccessRoutes({ status: 200, message: "Success", success: true }));

    } catch (error) {
        console.log('Error in order route:', error);
        return NextResponse.json(new ApiErrorRoutes({
            message: 'Internal Server Error',
            status: 500,
            error: error instanceof Error ? error.message : 'Unknown error'
        }))
    }
}