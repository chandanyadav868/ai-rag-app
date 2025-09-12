import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@google/genai";
import mongodbConnection from "@/mongodb/connection";
import UserSchema from "@/mongodb/schema/User.Schema";
import bcrypt from "bcryptjs"

interface ApiErrorRoutesProps {
    status: number;
    message: string;
    error: string
}
interface ApiSuccessRoutesProps {
    status: number;
    message: string;
    success:boolean
}

class ApiErrorRoutes {
    error = ''
    message = ''
    status = 500
    constructor({ error, message, status }: ApiErrorRoutesProps) {
        this.error = error
        this.message = message
        this.status = status
    }
}

class ApiSuccessRoutes {
    message = ''
    status = 200
    success = true
    constructor({message,status,success}:ApiSuccessRoutesProps){
        this.message = message
        this.status = status
        this.success = success
    }
}

export async function POST(req: NextRequest) {
    try {
        let { email, password } = await req.json();
        // if user did not provided credientials then give this error
        if (!email || !password) {
            return  NextResponse.json(new ApiSuccessRoutes({
                message:"Please Provide the creadentials",
                status:400,
                success:false
            }))
        }

        console.log("POST New Account Creating:- ",email,password);
        
        // connecting with mongodbServer before making request for creating user
        const connectionEstablished = await mongodbConnection();
        password = await bcrypt.hash(password,10);
        // console.log("Hashed Password:- ", password);
        

        // this for creating user and getting any error then log
        try {
            const createdNewUser = await UserSchema.create({
                email,
                password
            });
            console.log(createdNewUser);
            return NextResponse.json(new ApiSuccessRoutes({message:"Successfully created User",status:200,success:true}))
            
        } catch (error) {
            console.log("Error in creating User:- ", error);
            return NextResponse.json(
                new ApiErrorRoutes({ error: JSON.stringify(error), message: "Creating User got Error", status: 500 })
            )
        }

    } catch (error) {
        return NextResponse.json(new ApiErrorRoutes({ error: JSON.stringify(error), message: "Server Error", status: 500 }))
    }
}