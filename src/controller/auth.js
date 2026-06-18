import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
//@ts-ignore
import User from "../model/User.js";
//@ts-ignore
import { sendSuccess, sendError } from "../helper/response.js";

export const registerUser = async (req, res) => {
  try {
    const { email, password, method } = req.body;

    if (!email) {
      return sendError(res, "Email is required", 400);
    }

    const authMethod = method || "Email";

    if (!["Email", "Google"].includes(authMethod)) {
      return sendError(
        res,
        "Invalid authentication method. Must be 'Email' or 'Google'.",
        400,
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, "User with this email already exists", 400);
    }

    let hashedPassword;
    if (authMethod === "Email") {
      if (!password) {
        return sendError(
          res,
          "Password is required for Email registration",
          400,
        );
      }
      if (password.length < 6) {
        return sendError(
          res,
          "Password must be at least 6 characters long",
          400,
        );
      }
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      method: authMethod,
    });

    const savedUser = await newUser.save();

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is missing");
    }

    const token = jwt.sign(
      { id: savedUser._id, email: savedUser.email },
      jwtSecret,
      { expiresIn: "30d" },
    );

    const userData = {
      id: savedUser._id,
      email: savedUser.email,
      method: savedUser.method,
      createdAt: savedUser.createdAt,
    };

    return sendSuccess(
      res,
      "User registered successfully",
      { user: userData, token },
      201,
    );
  } catch (error) {
    return sendError(res, "User registration failed", 500, error);
  }
};

/**
 * Login a user.
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Email and password are required", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendError(res, "User does not exist", 400);
    }

    if (user.method === "Google") {
      return sendError(
        res,
        "This account is registered with Google. Please use Google Login.",
        400
      );
    }

    // Verify password exists (safety check for legacy/irregular data)
    if (!user.password) {
      return sendError(res, "Password is not set for this user account.", 400);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, "Incorrect password", 400);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is missing");
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      jwtSecret,
      { expiresIn: "30d" }
    );

    const userData = {
      id: user._id,
      email: user.email,
      method: user.method,
      createdAt: user.createdAt,
    };

    return sendSuccess(
      res,
      "User logged in successfully",
      { user: userData, token },
      200
    );
  } catch (error) {
    return sendError(res, "User login failed", 500, error);
  }
};
