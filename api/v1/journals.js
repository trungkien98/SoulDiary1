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
    const userId = user._id;
    const action = req.query.action;
    console.log(`📚 Journal handler - user: ${userId}, method: ${req.method}, action: ${action}`);

    // RESTORE endpoint: PATCH /api/v1/journals?id=xxx&action=restore
    if (action === 'restore' && req.method === 'PATCH') {
      if (!id) {
        console.log(`⚠️ Restore failed - journal ID not provided`);
        return sendError(res, "Journal ID is required to restore an entry.", 400);
      }
      
      try {
        console.log(`♾️ Restoring journal: ${id}`);
        const journal = await Journal.findOne({
          _id: id,
          user: userId,
          isDeleted: true,
        });
        if (!journal) {
          console.log(`⚠️ Journal not found or not deleted: ${id}`);
          return sendError(res, "Journal entry not found or is already active.", 404);
        }
        
        journal.isDeleted = false;
        journal.deletedAt = null;
        await journal.save();
        console.log(`✅ Journal restored successfully: ${id}`);
        
        return sendSuccess(res, { journal }, 200, "Your journal entry has been restored successfully.");
      } catch (error) {
        console.error(`❌ Restore journal error - ID: ${id}:`, error);
        return sendError(res, "Unable to restore the journal entry. Please try again.", 500);
      }
    }

    // Check for restore endpoint: /journals/:id/restore (legacy support)
    // In Vercel, req.url will be the path after /api/v1/journals
    const urlPath = req.url?.split('?')[0]; // Remove query string
    const restoreMatch = urlPath?.match(/\/([a-f0-9]{24})\/restore/i);
    if (restoreMatch && req.method === "PATCH") {
      const journalId = restoreMatch[1];
      console.log(`♻️ Restore journal (legacy): ${journalId}`);
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
          console.log(`💶 Fetching single journal: ${id} - user: ${userId}`);
          const journal = await Journal.findOne({
            _id: id,
            user: userId,
            isDeleted: false,
          });
          if (!journal) {
            console.log(`⚠️ Journal not found: ${id}`);
            return sendError(res, "Journal entry not found.", 404);
          }
          console.log(`✅ Journal retrieved successfully: ${id}`);
          return sendSuccess(res, { journal }, 200, "Journal entry retrieved successfully.");
        }

        // Get all journals with pagination
        console.log(`📚 Fetching journals list - user: ${userId}, page: ${req.query.page || 1}`);
        // Handle soft delete filtering based on includeDeleted parameter
        const includeDeleted = req.query.includeDeleted === 'true';
        const baseFilter = { user: userId, isDeleted: includeDeleted };
        
        // Create query with base filter
        let query = Journal.find(baseFilter);
        
        // Apply additional filters from query params (excluding includeDeleted to avoid override)
        const { includeDeleted: _, ...queryWithoutDelete } = req.query;
        const features = new APIFeatures(query, queryWithoutDelete).filter().sort().paginate();
        const journals = await features.query;
        const totalResults = await Journal.countDocuments(baseFilter);
        
        console.log(`✅ Journals retrieved - count: ${journals.length}, totalResults: ${totalResults}`);

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
          "Your journal entries have been retrieved successfully."
        );
      } catch (error) {
        console.error(`❌ Get journal error - user: ${userId}:`, error);
        return sendError(res, "Unable to fetch journal entries. Please try again.", 500);
      }
    }

    // POST - Create journal
    if (req.method === "POST") {
      try {
        const { title, content, mood, tags, isPublic, entryDate } = req.body;
        console.log(`✨ Creating new journal - user: ${userId}, title: ${!!title}, mood: ${mood}`);
        
        if (!content) {
          console.log(`⚠️ Journal creation failed - content is required`);
          return sendError(res, "Journal content is required. Please write something for your entry.", 400);
        }

        const journal = await Journal.create({
          user: userId,
          title,
          content,
          mood,
          tags,
          isPublic: isPublic || false,
          entryDate: entryDate || new Date(),
        });
        
        console.log(`✅ Journal created successfully - ID: ${journal._id}`);

        return sendSuccess(res, { journal }, 201, "Your journal entry has been created successfully.");
      } catch (error) {
        console.error(`❌ Create journal error - user: ${userId}:`, error);
        return sendError(res, "Unable to create journal entry. Please try again.", 500);
      }
    }

    // PUT - Update journal
    if (req.method === "PUT") {
      if (!id) {
        console.log(`⚠️ Update failed - journal ID not provided`);
        return sendError(res, "Journal ID is required to update an entry.", 400);
      }

      try {
        console.log(`🔍 Updating journal: ${id} - user: ${userId}`);
        const { title, content, mood, tags, isPublic } = req.body;
        const journal = await Journal.findOne({
          _id: id,
          user: userId,
          isDeleted: false,
        });

        if (!journal) {
          console.log(`⚠️ Journal not found: ${id}`);
          return sendError(res, "Journal entry not found.", 404);
        }

        if (title !== undefined) journal.title = title;
        if (content !== undefined) journal.content = content;
        if (mood !== undefined) journal.mood = mood;
        if (tags !== undefined) journal.tags = tags;
        if (isPublic !== undefined) journal.isPublic = isPublic;

        await journal.save();
        console.log(`✅ Journal updated successfully: ${id}`);
        return sendSuccess(res, { journal }, 200, "Your journal entry has been updated successfully.");
      } catch (error) {
        console.error(`❌ Update journal error - ID: ${id}:`, error);
        return sendError(res, "Unable to update journal entry. Please try again.", 500);
      }
    }

    // DELETE - Soft delete journal
    if (req.method === "DELETE") {
      if (!id) {
        console.log(`⚠️ Delete failed - journal ID not provided`);
        return sendError(res, "Journal ID is required to delete an entry.", 400);
      }

      try {
        console.log(`🛑 Soft deleting journal: ${id} - user: ${userId}`);
        const journal = await Journal.findOne({
          _id: id,
          user: userId,
          isDeleted: false,
        });

        if (!journal) {
          console.log(`⚠️ Journal not found: ${id}`);
          return sendError(res, "Journal entry not found.", 404);
        }

        journal.isDeleted = true;
        journal.deletedAt = new Date();
        await journal.save();
        
        console.log(`✅ Journal deleted successfully: ${id}`);
        return sendSuccess(res, {}, 200, "Your journal entry has been moved to trash. You can restore it later.");
      } catch (error) {
        console.error(`❌ Delete journal error - ID: ${id}:`, error);
        return sendError(res, "Unable to delete journal entry. Please try again.", 500);
      }
    }

    return sendError(res, "Method not allowed", 405);
  } catch (error) {
    if (error.statusCode === 401) {
      console.log(`🔒 Unauthorized journal access attempt`);
      return sendError(res, error.message, 401);
    }
    console.error(`❌ Journal handler error:`, {
      method: error.method,
      message: error.message
    });
    return sendError(res, "An unexpected error occurred. Please try again later.", 500);
  }
};
