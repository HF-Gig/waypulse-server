import sharp from "sharp";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import Update from "../model/Update.js";
import User from "../model/User.js";
import { sendSuccess, sendError } from "../helper/response.js";

const imagesDir = "./images";
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

export const createUpdate = async (req, res) => {
  try {
    const { category, description, province, city, status } = req.body;

    if (!category || !description || !province || !city || !status) {
      return sendError(
        res,
        "All fields (category, description, province, city, status) are required",
        400,
      );
    }

    if (!req.file) {
      return sendError(res, "Image file is required", 400);
    }

    const filename = `update-${Date.now()}.jpeg`;
    const outputPath = path.join(imagesDir, filename);

    await sharp(req.file.buffer).jpeg({ quality: 80 }).toFile(outputPath);

    const picturePath = `images/${filename}`;

    const user = await User.findById(req.userId);
    let uploaderName = "UE";
    if (user && user.show_name_in_update === "yes") {
      uploaderName = user.name || user.email.split("@")[0];
    }

    const newUpdate = new Update({
      category,
      description,
      province,
      city,
      status,
      picturePath,
      upvotes: 0,
      downvotes: 0,
      comments: {},
      shares: 0,
      uploaderName,
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
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : 3;
    const { category, search, province, city } = req.query;

    const query = {};
    if (category && category.toLowerCase() !== "all") {
      query.category = { $regex: new RegExp(`^${category}$`, "i") };
    }
    if (search && search.trim() !== "") {
      const searchRegex = { $regex: search, $options: "i" };
      query.$or = [
        { city: searchRegex },
        { province: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }
    if (province && province.toLowerCase() !== "all") {
      query.province = province;
    }
    if (city && city.toLowerCase() !== "all") {
      query.city = city;
    }

    if (page !== null) {
      const skip = (page - 1) * limit;
      const updates = await Update.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      const total = await Update.countDocuments(query);
      return sendSuccess(
        res,
        "Updates retrieved successfully",
        {
          updates,
          hasMore: skip + updates.length < total,
        },
        200,
      );
    } else {
      const updates = await Update.find(query).sort({ createdAt: -1 });
      return sendSuccess(res, "Updates retrieved successfully", updates, 200);
    }
  } catch (error) {
    console.error("Get updates error:", error);
    return sendError(res, "Failed to retrieve updates", 500, error);
  }
};

export const voteUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.body; // "upvote" or "downvote"
    const userID = req.userId;

    if (!["upvote", "downvote"].includes(vote)) {
      return sendError(
        res,
        "Invalid vote type. Must be 'upvote' or 'downvote'",
        400,
      );
    }

    const update = await Update.findById(id);
    if (!update) {
      return sendError(res, "Update not found", 404);
    }

    if (!update.votes) {
      update.votes = [];
    }

    const existingVoteIndex = update.votes.findIndex(
      (v) => v.userID === userID,
    );

    if (existingVoteIndex > -1) {
      if (update.votes[existingVoteIndex].vote === vote) {
        update.votes.splice(existingVoteIndex, 1);
      } else {
        update.votes[existingVoteIndex].vote = vote;
      }
    } else {
      update.votes.push({ vote, userID });
    }

    update.upvotes = update.votes.filter((v) => v.vote === "upvote").length;
    update.downvotes = update.votes.filter((v) => v.vote === "downvote").length;

    await update.save();

    return sendSuccess(
      res,
      "Vote recorded successfully",
      {
        upvotes: update.upvotes,
        downvotes: update.downvotes,
        votes: update.votes,
      },
      200,
    );
  } catch (error) {
    console.error("Vote update error:", error);
    return sendError(res, "Failed to record vote", 500, error);
  }
};

export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userID = req.userId;

    if (!text || text.trim() === "") {
      return sendError(res, "Comment text is required", 400);
    }

    const user = await User.findById(userID);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const userName = user.show_name_in_update === "yes" ? (user.name || user.email.split("@")[0]) : "UE";

    const update = await Update.findById(id);
    if (!update) {
      return sendError(res, "Update not found", 404);
    }

    if (!update.comments || typeof update.comments !== "object") {
      update.comments = {};
    }

    const commentID = new mongoose.Types.ObjectId().toString();

    const newComment = {
      userID,
      userName,
      text,
      createdAt: new Date().toISOString(),
    };

    update.comments = {
      ...update.comments,
      [commentID]: newComment,
    };
    update.markModified("comments");

    await update.save();

    return sendSuccess(res, "Comment added successfully", update.comments, 201);
  } catch (error) {
    console.error("Add comment error:", error);
    return sendError(res, "Failed to add comment", 500, error);
  }
};

export const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const update = await Update.findById(id);
    if (!update) {
      return sendError(res, "Update not found", 404);
    }

    const commentsObj = update.comments || {};
    const commentsArray = Object.values(commentsObj);

    // Sort by createdAt descending (latest first, oldest after)
    commentsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedComments = commentsArray.slice(startIndex, endIndex);

    return sendSuccess(
      res,
      "Comments retrieved successfully",
      {
        comments: paginatedComments,
        hasMore: endIndex < commentsArray.length,
        total: commentsArray.length,
      },
      200
    );
  } catch (error) {
    console.error("Get comments error:", error);
    return sendError(res, "Failed to retrieve comments", 500, error);
  }
};

