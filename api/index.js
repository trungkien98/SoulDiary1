require("dotenv").config();

const { handleCORS, sendSuccess, sendError } = require("../lib/utils");

/**
 * Catch-all handler for undefined routes
 * Provides API info and documentation
 */
module.exports = async (req, res) => {
  // Handle CORS
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  // Root endpoint
  if (req.url === "/" || req.url === "") {
    return sendSuccess(
      res,
      {
        message: "Soul Diary API - Journaling Application",
        version: "1.0.0",
        documentation: "https://github.com/your-repo",
        healthCheck: "/api/health",
        endpoints: {
          auth: "/api/v1/auth",
          journals: "/api/v1/journals",
          users: "/api/v1/users",
          otp: "/api/v1/otp",
        },
      },
      200,
      "🎉 Soul Diary API is running!"
    );
  }

  // For any other unmatched route
  return sendError(res, "Route not found", 404);
};

