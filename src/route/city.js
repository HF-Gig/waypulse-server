import { Router } from "express";
import multer from "multer";
import { createCity, getCities, toggleCityStatus } from "../controller/city.js";

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

router.post("/", upload.single("image"), createCity);
router.get("/", getCities);
router.put("/:id/status", toggleCityStatus);

export default router;
