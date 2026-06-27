import { Router } from "express";
import jwt from "jsonwebtoken";
//@ts-ignore
import { registerUser, loginUser, googleLogin, checkGoogleSignup, googleRegister, getPreferences, updatePreferences, getAllUsers, deleteUser, updateUser } from "../controller/auth.js";
import { sendError } from "../helper/response.js";

const router = Router();

// Middleware to authenticate Bearer token
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, "Authorization token is missing", 401);
  }
  const token = authHeader.split(" ")[1];
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return sendError(res, "JWT secret is missing from server configuration", 500);
    }
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return sendError(res, "Invalid or expired token", 401);
  }
};

// GET /api/auth/users
router.get("/users", getAllUsers);

// DELETE /api/auth/users/:id
router.delete("/users/:id", deleteUser);

// PUT /api/auth/users/:id
router.put("/users/:id", updateUser);

// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/login
router.post("/login", loginUser);

// POST /api/auth/google-login
router.post("/google-login", googleLogin);

// POST /api/auth/check-google-signup
router.post("/check-google-signup", checkGoogleSignup);

// POST /api/auth/google-register
router.post("/google-register", googleRegister);

// GET /api/auth/preferences
router.get("/preferences", authenticate, getPreferences);

// POST /api/auth/preferences
router.post("/preferences", authenticate, updatePreferences);

export default router;
