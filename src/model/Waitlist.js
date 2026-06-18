import mongoose from "mongoose";

const waitlistSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    joined_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
    number_of_joining: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: false,
    collection: "waitlist",
  },
);

const Waitlist = mongoose.model("Waitlist", waitlistSchema);

export default Waitlist;
