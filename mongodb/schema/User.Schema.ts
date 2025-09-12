import mongoose from "mongoose";



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
