import mongoose, { Schema } from "mongoose";

interface OrderSchemaProps {
    userId:Schema.Types.ObjectId,
    razorpayOrderId:string,
    amount:number,
    currency:string,
    status:"Pending" | "Success",
    paymentDetails?:object
}

const orderSchema = new Schema<OrderSchemaProps>({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    razorpayOrderId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, required: true },
    paymentDetails: { type: Object }
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;