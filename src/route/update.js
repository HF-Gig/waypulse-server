import { Router } from "express";
import multer from "multer";
//@ts-ignore
import { createUpdate, getUpdates, voteUpdate, addComment, getComments } from "../controller/update.js";
import { authenticate } from "./auth.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

router.post("/", authenticate, upload.single("image"), createUpdate);

router.get("/", getUpdates);

router.post("/:id/vote", authenticate, voteUpdate);

router.post("/:id/comment", authenticate, addComment);

router.get("/:id/comments", getComments);


export default router;
