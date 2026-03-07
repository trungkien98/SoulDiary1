/**
 * Setup CORS headers for Vercel API routes
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Allowed origins for CORS
const whiteList = (process.env.FE_ADMIN_CLIENT_HOST || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

whiteList.push(
  "https://souldiary1.vercel.app",
  "https://souldiary1.onrender.com",
  "http://localhost:8081",
  "http://localhost:5173",
  "http://localhost:4200",
  "http://localhost:3000",
);

/**
 * Validate request origin and set appropriate CORS headers
 */
const setCORS = (req, res) => {
  const origin = req.headers.origin;
  
  // Allow requests without origin (Mobile/Postman)
  if (!origin) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return;
  }

  // Check whitelist
  if (whiteList.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
};

/**
 * Handle preflight OPTIONS request
 */
const handleCORS = (req, res) => {
  if (req.method === "OPTIONS") {
    setCORS(req, res);
    res.setHeader("Access-Control-Allow-Methods", corsHeaders["Access-Control-Allow-Methods"]);
    res.setHeader("Access-Control-Allow-Headers", corsHeaders["Access-Control-Allow-Headers"]);
    return res.status(200).end();
  }
  setCORS(req, res);
};

/**
 * Send success response
 */
const sendSuccess = (res, data = {}, status = 200, message = "Success") => {
  res.status(status).json({
    status: "success",
    message,
    data,
  });
};

/**
 * Send error response
 */
const sendError = (res, message = "Error", statusCode = 400) => {
  res.status(statusCode).json({
    status: "fail",
    message,
  });
};

module.exports = {
  handleCORS,
  setCORS,
  sendSuccess,
  sendError,
};
