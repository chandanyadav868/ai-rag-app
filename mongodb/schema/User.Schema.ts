import mongoose from "mongoose";

export interface UserSchemaProp {
    _id?:string;
    email:string;
    password?:string;
    username?:string;
    emailVerified:boolean;
    avatar?:string;
    plan: UserPlan
}

type UserPlan = "Free" | "Premium"

const UserSchema = new mongoose.Schema<UserSchemaProp>({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
    },
    username: {
        type: String,
    },
    emailVerified: {
        type: Boolean
    },
    avatar: {
        type: String,
    },
    plan:{
        type:String,
        enum : ["Free", "Premium"],
        default: "Free"
    }
}, {
    timestamps: true
});

// Yahan mongoose.models se check karo
export default mongoose.models && mongoose.models.User || mongoose.model("User", UserSchema);
