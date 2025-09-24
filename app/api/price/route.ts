import { NextRequest, NextResponse } from "next/server";
import { ApiErrorRoutes, ApiSuccessRoutes } from "../register/route";
import PriceSchema, { PriceSchemaProps } from "@/mongodb/schema/Price.Schema";
import mongodbConnection from "@/mongodb/connection";

export async function POST(req: NextRequest) {
    try {
        const { price } = await req.json();
        console.log(price);
        
        await mongodbConnection();
        // bulkwrite a array with object and that object will have updateOne with filter as type and update as rate and upsert as true
        const bulkDataWritten = await PriceSchema.bulkWrite(
            price.map((data: PriceSchemaProps) => (
                {
                    // if by filter it got a match then update else with the help of upsert create a new one
                    updateOne: {
                        filter: { type: data.type },
                        update: { $set: { credits: data.credits, type: data.type, rate: data.rate } },
                        upsert: true
                    }
                }
            ))
        );

        
        console.log('Bulk Data Written:', bulkDataWritten);
        return NextResponse.json(
            new ApiSuccessRoutes(
            {
                message: 'Price data updated successfully',
                status: 200,
                success: true
            }
        )
        )

    } catch (error) {
        console.log('Error in POST /api/price:', error);
        return NextResponse.json(
            new ApiErrorRoutes({
                message: 'Failed to fetch price data',
                status: 500,
                error: error instanceof Error ? error.message : String(error)
            })
        )

    }
}

