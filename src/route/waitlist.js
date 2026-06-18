import { Router } from "express";
//@ts-ignore
import { joinWaitlist, getWaitlist } from "../controller/waitlist.js";

const router = Router();

// POST /api/waitlist - Join the waitlist
router.post("/", joinWaitlist);

// GET /api/waitlist - List all waitlist signups
router.get("/", getWaitlist);

export default router;
