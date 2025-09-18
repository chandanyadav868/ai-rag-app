import mongoose, { Model, Schema, Document } from "mongoose";

export interface FeedbackSchemaProp extends Document {
  createdBy: mongoose.Types.ObjectId | UserSchemaProp;
  feedback: string;
  __v?:number;
  _id:string;
  createdAt?:string;
  updatedAt?:string;
}

const feedbackSchema = new Schema<FeedbackSchemaProp>(
  {
    createdBy: {
      type: Schema.Types.ObjectId, // ✅ use Schema.Types, not mongoose.Types
      ref: "User",
      required: true,
    },
    feedback: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const feedbackFormSchema =
  (mongoose.models.Feedback as Model<FeedbackSchemaProp>) ||
  mongoose.model<FeedbackSchemaProp>("Feedback", feedbackSchema);
