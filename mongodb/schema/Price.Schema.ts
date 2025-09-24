import mongoose, { Schema } from "mongoose";

export interface PriceSchemaProps {
    rate:number;
    credit:number;
    type:"Silver"| "Gold"| "Platinum"
}


const priceSchema = new Schema({
    rate: { type: Number, required: true },
    credit: { type: Number, required: true },
    type: {
        type: String,
        enum: ["Silver", "Gold", "Platinum"],
        required: true
    }
}, { timestamps: true });

// Yahan mongoose.models se check karo
export default mongoose.models && mongoose.models.Price || mongoose.model("Price", priceSchema);