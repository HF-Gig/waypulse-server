import sharp from "sharp";
import path from "path";
import fs from "fs";
import Update from "../model/Update.js";
import { sendSuccess, sendError } from "../helper/response.js";

// Ensure images directory exists
const imagesDir = "./images";
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

export const createUpdate = async (req, res) => {
  try {
    const { category, description, province, city, status } = req.body;

    // Validation
    if (!category || !description || !province || !city || !status) {
      return sendError(res, "All fields (category, description, province, city, status) are required", 400);
    }

    if (!req.file) {
      return sendError(res, "Image file is required", 400);
    }

    // Generate compressed file name and output path
    const filename = `update-${Date.now()}.jpeg`;
    const outputPath = path.join(imagesDir, filename);

    // Compress the image using sharp
    await sharp(req.file.buffer)
      .jpeg({ quality: 80 }) // Compress to JPEG with 80% quality
      .toFile(outputPath);

    const picturePath = `images/${filename}`;

    // Save update in DB
    const newUpdate = new Update({
      category,
      description,
      province,
      city,
      status,
      picturePath,
    });

    await newUpdate.save();

    return sendSuccess(res, "Update published successfully", newUpdate, 201);
  } catch (error) {
    console.error("Create update error:", error);
    return sendError(res, "Failed to create update", 500, error);
  }
};

export const getUpdates = async (req, res) => {
  try {
    const updates = await Update.find().sort({ createdAt: -1 });
    return sendSuccess(res, "Updates retrieved successfully", updates, 200);
  } catch (error) {
    console.error("Get updates error:", error);
    return sendError(res, "Failed to retrieve updates", 500, error);
  }
};
