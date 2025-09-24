import mongoose from "mongoose";

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
    name:{
        type:String
    },
    image:{
        type:String
    },
    plan:{
        type:String,
        enum : ["Free", "Silver", "Gold", "Platinum"],
        default: "Free"
    },
    credit:{
        type :Number,
        default : 20
    }
}, {
    timestamps: true
});

// Yahan mongoose.models se check karo
export default mongoose.models && mongoose.models.User || mongoose.model("User", UserSchema);
