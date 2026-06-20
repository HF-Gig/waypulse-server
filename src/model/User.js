import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
    },
    method: {
      type: String,
      enum: ["Email", "Google"],
      default: "Email",
      required: true,
    },
    show_name_in_update: {
      type: String,
      enum: ["yes", "no"],
      default: "yes",
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    name: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  },
);

const User = mongoose.model("User", userSchema);

export default User;
