import mongoose from "mongoose";

const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "City name is required"],
      trim: true,
    },
    province: {
      type: String,
      required: [true, "Province is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Pending"],
      default: "Active",
      required: true,
    },
    routesCount: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "cities",
  }
);

const City = mongoose.model("City", citySchema);
export default City;
