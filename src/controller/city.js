import sharp from "sharp";
import path from "path";
import fs from "fs";
import City from "../model/City.js";
import { sendSuccess, sendError } from "../helper/response.js";

const imagesDir = "./images";
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

export const createCity = async (req, res) => {
  try {
    const { name, province, description, category } = req.body;

    if (!name || !province || !description || !category) {
      return sendError(
        res,
        "All fields (name, province, description, category) are required",
        400
      );
    }

    let imageUrl = undefined;
    if (req.file) {
      const filename = `city-${Date.now()}.jpeg`;
      const outputPath = path.join(imagesDir, filename);
      await sharp(req.file.buffer).jpeg({ quality: 80 }).toFile(outputPath);
      imageUrl = `images/${filename}`;
    }

    const newCity = new City({
      name,
      province,
      description,
      category,
      imageUrl,
      status: "Active",
      routesCount: 0,
    });

    await newCity.save();

    return sendSuccess(res, "City created successfully", newCity, 201);
  } catch (error) {
    console.error("Create city error:", error);
    return sendError(res, "Failed to create city", 500, error);
  }
};

export const getCities = async (req, res) => {
  try {
    const { search, province, status, page = 1, limit = 5 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (search && search.trim() !== "") {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { province: { $regex: search, $options: "i" } },
      ];
    }

    if (province) {
      query.province = province;
    }

    if (status) {
      query.status = status;
    }

    const total = await City.countDocuments(query);
    const cities = await City.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const hasMore = skip + cities.length < total;

    return sendSuccess(res, "Cities retrieved successfully", {
      cities,
      total,
      hasMore,
    }, 200);
  } catch (error) {
    console.error("Get cities error:", error);
    return sendError(res, "Failed to retrieve cities", 500, error);
  }
};

export const toggleCityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const city = await City.findById(id);
    if (!city) {
      return sendError(res, "City not found", 404);
    }

    city.status = city.status === "Active" ? "Pending" : "Active";
    await city.save();

    return sendSuccess(res, "City status toggled successfully", city, 200);
  } catch (error) {
    console.error("Toggle city status error:", error);
    return sendError(res, "Failed to toggle city status", 500, error);
  }
};
