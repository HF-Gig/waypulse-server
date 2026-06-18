import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_DB_URI;
    if (!mongoURI) {
      throw new Error("MONGO_DB_URI environment variable is missing");
    }
    const conn = await mongoose.connect(mongoURI);
    console.log(`[database]: MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[database]: MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
