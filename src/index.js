import express from "express";
import cors from "cors";
import dotenv from "dotenv";
//@ts-ignore
import helloRoutes from "./route/hello.js";
//@ts-ignore
import authRoutes from "./route/auth.js";
//@ts-ignore
import updateRoutes from "./route/update.js";
//@ts-ignore
import waitlistRoutes from "./route/waitlist.js";
//@ts-ignore
import cityRoutes from "./route/city.js";
//@ts-ignore
import connectDB from "./config/db.js";

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use("/images", express.static("images"));

app.use("/api/hello", helloRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/updates", updateRoutes);
app.use("/api/waitlist", waitlistRoutes);
app.use("/api/cities", cityRoutes);

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
