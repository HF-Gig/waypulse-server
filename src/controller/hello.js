//@ts-ignore
import { sendSuccess, sendError } from "../helper/response.js";

export const getHello = (req, res) => {
  try {
    return sendSuccess(res, "Hello World! Welcome to the Waypulse API.", {
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return sendError(res, "Failed to process hello world request", 500, error);
  }
};
