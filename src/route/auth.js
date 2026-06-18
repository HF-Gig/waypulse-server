import { Router } from "express";
//@ts-ignore
import { registerUser, loginUser } from "../controller/auth.js";

const router = Router();

// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/login
router.post("/login", loginUser);

export default router;
