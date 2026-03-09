require("dotenv").config();

const { connectDB } = require("../../lib/db");
const { handleCORS, sendSuccess, sendError } = require("../../lib/utils");
const { protect } = require("../../lib/auth");
const Journal = require("../../models/journalModel");
const { APIFeatures } = require("../../utils/apiFeature");

/**
 * Consolidated Journal Handler
 * GET/POST /api/v1/journals (list and create)
 * GET/PUT/DELETE /api/v1/journals?id=xxx (detail operations)
 * PATCH /api/v1/journals/:id/restore (restore soft-deleted entry)
 */
module.exports = async (req, res) => {
  handleCORS(req, res);
  if (req.method === "OPTIONS") return;

  try {
    await connectDB();
    const user = await protect(req);
    const { id } = req.query;

    // Check for restore endpoint: /journals/:id/restore
    // In Vercel, req.url will be the path after /api/v1/journals
    const restoreMatch = req.url?.match(/^\/([a-f0-9]{24})\/restore/i) || req.url?.match(/\/([a-f0-9]{24})\/restore/i);
    if (restoreMatch && req.method === "PATCH") {
      const journalId = restoreMatch[1];
      try {
        const journal = await Journal.findOne({
          _id: journalId,
          user: user._id,
          isDeleted: true,
        });
        if (!journal) return sendError(res, "Journal not found or already active", 404);
        
        journal.isDeleted = false;
        journal.deletedAt = null;
        await journal.save();
        
        return sendSuccess(res, { journal }, 200, "Journal restored successfully");
      } catch (error) {
        console.error("Restore journal error:", error);
        return sendError(res, error.message || "Failed to restore journal", 500);
      }
    }

    // GET - Fetch journals (LIST or SINGLE)
    if (req.method === "GET") {
      try {
        if (id) {
          // Get single journal
          const journal = await Journal.findOne({
            _id: id,
            user: user._id,
            isDeleted: false,
          });
          if (!journal) return sendError(res, "Journal not found", 404);
          return sendSuccess(res, { journal }, 200, "Journal retrieved");
        }

        // Get all journals with pagination
        let query = Journal.find({ user: user._id, isDeleted: false });
        const features = new APIFeatures(query, req.query).filter().sort().paginate();
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
        console.error("Get journal error:", error);
        return sendError(res, error.message || "Failed to fetch journals", 500);
      }
    }

    // POST - Create journal
    if (req.method === "POST") {
      try {
        const { title, content, mood, tags, isPublic, entryDate } = req.body;
        if (!content) return sendError(res, "Content is required", 400);

        const journal = await Journal.create({
          user: user._id,
          title,
          content,
          mood,
          tags,
          isPublic: isPublic || false,
          entryDate: entryDate || new Date(),
        });

        return sendSuccess(res, { journal }, 201, "Journal created successfully");
      } catch (error) {
        console.error("Create journal error:", error);
        return sendError(res, error.message || "Failed to create journal", 500);
      }
    }

    // PUT - Update journal
    if (req.method === "PUT") {
      if (!id) return sendError(res, "Journal ID is required", 400);

      try {
        const { title, content, mood, tags, isPublic } = req.body;
        const journal = await Journal.findOne({
          _id: id,
          user: user._id,
          isDeleted: false,
        });

        if (!journal) return sendError(res, "Journal not found", 404);

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
      if (!id) return sendError(res, "Journal ID is required", 400);

      try {
        const journal = await Journal.findOne({
          _id: id,
          user: user._id,
          isDeleted: false,
        });

        if (!journal) return sendError(res, "Journal not found", 404);

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
    if (error.statusCode === 401) return sendError(res, error.message, 401);
    console.error("Journal handler error:", error);
    return sendError(res, error.message || "Internal server error", 500);
  }
};
