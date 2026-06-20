import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
//@ts-ignore
import User from "../model/User.js";
//@ts-ignore
import { sendSuccess, sendError } from "../helper/response.js";

export const registerUser = async (req, res) => {
  try {
    const { email, password, method, name, show_name_in_update } = req.body;

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
      name: name || "",
      show_name_in_update: show_name_in_update || "yes",
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
        400,
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

    const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, {
      expiresIn: "30d",
    });

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
      200,
    );
  } catch (error) {
    return sendError(res, "User login failed", 500, error);
  }
};

export const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return sendError(res, "User not found", 404);
    }
    return sendSuccess(
      res,
      "Preferences retrieved successfully",
      {
        show_name_in_update: user.show_name_in_update || "yes",
        name: user.name || "",
        theme: user.theme || "light",
      },
      200,
    );
  } catch (error) {
    console.error("Get preferences error:", error);
    return sendError(res, "Failed to retrieve preferences", 500, error);
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const { show_name_in_update, name, theme } = req.body;

    const updateData = {};
    if (show_name_in_update !== undefined) {
      if (!["yes", "no"].includes(show_name_in_update)) {
        return sendError(
          res,
          "Invalid preference value. Must be 'yes' or 'no'.",
          400,
        );
      }
      updateData.show_name_in_update = show_name_in_update;
    }

    if (name !== undefined) {
      updateData.name = name;
    }

    if (theme !== undefined) {
      if (!["light", "dark"].includes(theme)) {
        return sendError(
          res,
          "Invalid theme value. Must be 'light' or 'dark'.",
          400,
        );
      }
      updateData.theme = theme;
    }

    const user = await User.findByIdAndUpdate(req.userId, updateData, {
      new: true,
    });
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    return sendSuccess(
      res,
      "Preferences updated successfully",
      {
        show_name_in_update: user.show_name_in_update,
        name: user.name || "",
        theme: user.theme,
      },
      200,
    );
  } catch (error) {
    console.error("Update preferences error:", error);
    return sendError(res, "Failed to update preferences", 500, error);
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return sendError(res, "Google ID token is required", 400);
    }

    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
    );
    if (!response.ok) {
      return sendError(res, "Invalid Google ID token", 400);
    }

    const payload = await response.json();
    const { email, email_verified, aud } = payload;

    if (!email_verified || email_verified === "false") {
      return sendError(res, "Google account email is not verified", 400);
    }

    const allowedClientIds = [
      "467286540775-0u8rrrocivl87r1ggg5q2qetv562hdqu.apps.googleusercontent.com", // Web client ID
      "467286540775-roinen5h022u6oo1ku3tlcit1mc0fl3v.apps.googleusercontent.com", // Android client ID
    ];

    if (!allowedClientIds.includes(aud)) {
      return sendError(
        res,
        "Google ID token was not issued for this application",
        400,
      );
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return sendError(res, "Account doesn't exist", 400);
    }

    if (user.method !== "Google") {
      return sendError(
        res,
        "This email was registered using email/password. Please use email/password.",
        400,
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is missing");
    }

    const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, {
      expiresIn: "30d",
    });

    const userData = {
      id: user._id,
      email: user.email,
      method: user.method,
      createdAt: user.createdAt,
    };

    return sendSuccess(
      res,
      "User logged in successfully with Google",
      { user: userData, token },
      200,
    );
  } catch (error) {
    console.error("Google login error:", error);
    return sendError(res, "Google login failed", 500, error);
  }
};

/**
 * Check if a Google email is available for registration.
 */
export const checkGoogleSignup = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return sendError(res, "Google ID token is required", 400);
    }

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) {
      return sendError(res, "Invalid Google ID token", 400);
    }

    const payload = await response.json();
    const { email, email_verified, aud } = payload;

    if (!email_verified || email_verified === "false") {
      return sendError(res, "Google account email is not verified", 400);
    }

    const allowedClientIds = [
      "467286540775-0u8rrrocivl87r1ggg5q2qetv562hdqu.apps.googleusercontent.com",
      "467286540775-roinen5h022u6oo1ku3tlcit1mc0fl3v.apps.googleusercontent.com",
    ];

    if (!allowedClientIds.includes(aud)) {
      return sendError(res, "Google ID token was not issued for this application", 400);
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return sendError(res, "User with this email already exists", 400);
    }

    return sendSuccess(res, "Email is available for registration", { email: normalizedEmail });
  } catch (error) {
    console.error("Check Google signup error:", error);
    return sendError(res, "Verification failed", 500, error);
  }
};

/**
 * Register a user via Google.
 */
export const googleRegister = async (req, res) => {
  try {
    const { idToken, name, show_name_in_update } = req.body;
    if (!idToken) {
      return sendError(res, "Google ID token is required", 400);
    }
    if (!name || !name.trim()) {
      return sendError(res, "Name is required", 400);
    }

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) {
      return sendError(res, "Invalid Google ID token", 400);
    }

    const payload = await response.json();
    const { email, email_verified, aud } = payload;

    if (!email_verified || email_verified === "false") {
      return sendError(res, "Google account email is not verified", 400);
    }

    const allowedClientIds = [
      "467286540775-0u8rrrocivl87r1ggg5q2qetv562hdqu.apps.googleusercontent.com",
      "467286540775-roinen5h022u6oo1ku3tlcit1mc0fl3v.apps.googleusercontent.com",
    ];

    if (!allowedClientIds.includes(aud)) {
      return sendError(res, "Google ID token was not issued for this application", 400);
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, "User with this email already exists", 400);
    }

    const newUser = new User({
      email: normalizedEmail,
      method: "Google",
      name: name.trim(),
      show_name_in_update: show_name_in_update || "yes",
    });

    const savedUser = await newUser.save();

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is missing");
    }

    const token = jwt.sign({ id: savedUser._id, email: savedUser.email }, jwtSecret, {
      expiresIn: "30d",
    });

    const userData = {
      id: savedUser._id,
      email: savedUser.email,
      method: savedUser.method,
      createdAt: savedUser.createdAt,
    };

    return sendSuccess(
      res,
      "User registered successfully with Google",
      { user: userData, token },
      201
    );
  } catch (error) {
    console.error("Google registration error:", error);
    return sendError(res, "Google registration failed", 500, error);
  }
};

