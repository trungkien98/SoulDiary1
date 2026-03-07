require("dotenv").config();

const { connectDB } = require("../../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../../lib/utils");
const { protect } = require("../../../lib/auth");
const Journal = require("../../../models/journalModel");
const APIFeatures = require("../../../utils/apiFeature");

/**
 * GET /api/v1/journals - Get all journals for user (with pagination)
 * POST /api/v1/journals - Create new journal entry
 */
export default async (req, res) => {
  // Handle CORS
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  try {
    // Connect to database
    await connectDB();

    // Protect route - verify user
    const user = await protect(req);

    // GET - Fetch journals
    if (req.method === "GET") {
      try {
        // Build query
        let query = Journal.find({ user: user._id, isDeleted: false });

        // Apply filters
        const features = new APIFeatures(query, req.query)
          .filter()
          .sort()
          .paginate();

        const journals = await features.query;
        const totalResults = await Journal.countDocuments({
          user: user._id,
          isDeleted: false,
        });

        return sendSuccess(
          res,
          {
            journals,
            pagination: {
              page: req.query.page || 1,
              limit: req.query.limit || 10,
              totalResults,
              totalPages: Math.ceil(totalResults / (req.query.limit || 10)),
            },
          },
          200,
          "Journals retrieved successfully"
        );
      } catch (error) {
        console.error("Get journals error:", error);
        return sendError(res, error.message || "Failed to fetch journals", 500);
      }
    }

    // POST - Create journal
    if (req.method === "POST") {
      try {
        const { title, content, mood, tags, isPublic, entryDate } = req.body;

        // Validate required fields
        if (!content) {
          return sendError(res, "Content is required", 400);
        }

        // Create journal
        const journal = await Journal.create({
          user: user._id,
          title,
          content,
          mood,
          tags,
          isPublic: isPublic || false,
          entryDate: entryDate || new Date(),
        });

        return sendSuccess(
          res,
          { journal },
          201,
          "Journal created successfully"
        );
      } catch (error) {
        console.error("Create journal error:", error);
        return sendError(res, error.message || "Failed to create journal", 500);
      }
    }

    return sendError(res, "Method not allowed", 405);
  } catch (error) {
    if (error.statusCode === 401) {
      return sendError(res, error.message, 401);
    }
    console.error("Journal handler error:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};
