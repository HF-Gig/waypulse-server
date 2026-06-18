import { Router } from "express";
import multer from "multer";
//@ts-ignore
import { createUpdate, getUpdates } from "../controller/update.js";

const router = Router();

// Multer memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// POST /api/updates
router.post("/", upload.single("image"), createUpdate);

// GET /api/updates
router.get("/", getUpdates);

export default router;
