import mongoose from "mongoose";

const updateSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    province: {
      type: String,
      required: [true, "Province is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Opened", "Closed"],
      default: "Opened",
      required: true,
    },
    picturePath: {
      type: String,
      required: [true, "Picture path is required"],
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    shares: {
      type: Number,
      default: 0,
    },
    uploaderName: {
      type: String,
      default: "UE",
    },
    votes: {
      type: [
        {
          vote: { type: String, enum: ["upvote", "downvote"] },
          userID: { type: String },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Update = mongoose.model("Update", updateSchema);

export default Update;
