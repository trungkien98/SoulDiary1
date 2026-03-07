require("dotenv").config();

const { connectDB } = require("../../../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../../../lib/utils");
const { protect } = require("../../../../lib/auth");
const Journal = require("../../../../models/journalModel");

/**
 * GET /api/v1/journals/[id] - Get single journal
 * PUT /api/v1/journals/[id] - Update journal
 * DELETE /api/v1/journals/[id] - Delete journal
 */
export default async (req, res) => {
  // Handle CORS
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  try {
    // Connect to database
    await connectDB();

    // Protect route
    const user = await protect(req);

    const { id } = req.query;

    if (!id) {
      return sendError(res, "Journal ID is required", 400);
    }

    // GET - Fetch single journal
    if (req.method === "GET") {
      try {
        const journal = await Journal.findOne({
          _id: id,
          user: user._id,
          isDeleted: false,
        });

        if (!journal) {
          return sendError(res, "Journal not found", 404);
        }

        return sendSuccess(res, { journal }, 200, "Journal retrieved");
      } catch (error) {
        console.error("Get journal error:", error);
        return sendError(res, "Failed to fetch journal", 500);
      }
    }

    // PUT - Update journal
    if (req.method === "PUT") {
      try {
        const { title, content, mood, tags, isPublic } = req.body;

        const journal = await Journal.findOne({
          _id: id,
          user: user._id,
          isDeleted: false,
        });

        if (!journal) {
          return sendError(res, "Journal not found", 404);
        }

        // Update fields
        if (title !== undefined) journal.title = title;
        if (content !== undefined) journal.content = content;
        if (mood !== undefined) journal.mood = mood;
        if (tags !== undefined) journal.tags = tags;
        if (isPublic !== undefined) journal.isPublic = isPublic;

        await journal.save();

        return sendSuccess(res, { journal }, 200, "Journal updated successfully");
      } catch (error) {
        console.error("Update journal error:", error);
        return sendError(res, error.message || "Failed to update journal", 500);
      }
    }

    // DELETE - Soft delete journal
    if (req.method === "DELETE") {
      try {
        const journal = await Journal.findOne({
          _id: id,
          user: user._id,
          isDeleted: false,
        });

        if (!journal) {
          return sendError(res, "Journal not found", 404);
        }

        // Soft delete
        journal.isDeleted = true;
        journal.deletedAt = new Date();
        await journal.save();

        return sendSuccess(res, {}, 200, "Journal deleted successfully");
      } catch (error) {
        console.error("Delete journal error:", error);
        return sendError(res, "Failed to delete journal", 500);
      }
    }

    return sendError(res, "Method not allowed", 405);
  } catch (error) {
    if (error.statusCode === 401) {
      return sendError(res, error.message, 401);
    }
    console.error("Journal detail handler error:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};
