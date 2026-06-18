/**
 * Standard Success Response helper.
 */
export const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standard Error Response helper.
 */
export const sendError = (res, message, statusCode = 500, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : error,
  });
};
