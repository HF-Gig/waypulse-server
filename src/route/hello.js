import { Router } from "express";
//@ts-ignore
import { getHello } from "../controller/hello.js";

const router = Router();

// GET /api/hello
router.get("/hello", getHello);

export default router;
