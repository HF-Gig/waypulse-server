import Waitlist from "../model/Waitlist.js";
import { sendSuccess, sendError } from "../helper/response.js";

export const joinWaitlist = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, "Email address is required", 400);
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, "Please enter a valid email address", 400);
    }

    const existingEntry = await Waitlist.findOne({
      email: email.toLowerCase(),
    });
    if (existingEntry) {
      return sendError(
        res,
        "This email is already registered on the waitlist.",
        400,
        { number_of_joining: existingEntry.number_of_joining },
      );
    }

    const currentCount = await Waitlist.countDocuments();
    const numberOfJoining = currentCount + 1;

    const newEntry = new Waitlist({
      email,
      number_of_joining: numberOfJoining,
    });

    await newEntry.save();

    return sendSuccess(
      res,
      "Successfully joined the waitlist!",
      {
        email: newEntry.email,
        joined_at: newEntry.joined_at,
        number_of_joining: newEntry.number_of_joining,
      },
      201,
    );
  } catch (error) {
    console.error("Waitlist registration error:", error);
    return sendError(res, "Failed to join the waitlist", 500, error);
  }
};

export const getWaitlist = async (req, res) => {
  try {
    const entries = await Waitlist.find().sort({ joined_at: -1 });
    return sendSuccess(
      res,
      "Waitlist entries retrieved successfully",
      entries,
      200,
    );
  } catch (error) {
    console.error("Get waitlist error:", error);
    return sendError(res, "Failed to retrieve waitlist entries", 500, error);
  }
};
