const express = require("express");
const journalController = require("../controller/journalController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Journals
 *     description: 📔 Journal CRUD operations (requires authentication) | Các hành động CRUD nhật ký (yêu cầu đăng nhập)
 */

/**
 * @openapi
 * /api/v1/journals:
 *   post:
 *     tags: [Journals]
 *     summary: Create a new journal entry | Tạo bài viết nhật ký mới
 *     description: Create a new journal entry with title, content, mood, and other metadata | Tạo một bài viết nhật ký mới
 *     security:
 *       - bearer: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               title:
 *                 type: string
 *                 description: Journal entry title
 *                 example: My First Day
 *               content:
 *                 type: string
 *                 description: Main journal content (required)
 *                 example: Today was an amazing day filled with personal growth and reflection...
 *               mood:
 *                 type: string
 *                 description: Emotional mood of the entry
 *                 enum: [happy, sad, angry, anxious, neutral, excited, tired]
 *                 example: happy
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [personal, growth, achievement, reflection, healing, gratitude, relationships, family, work, career, health, self-care, creative, morning, evening, challenge, success]
 *                 description: Tags to organize journals (select from predefined list, organized by category)
 *                 example: [personal, growth, morning]
 *               entryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date of the journal entry (defaults to current date)
 *                 example: "2026-03-05T10:00:00.000Z"
 *               isPublic:
 *                 type: boolean
 *                 description: Make journal public or private (default false)
 *                 example: false
 *     responses:
 *       201:
 *         description: Journal entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     journal:
 *                       $ref: '#/components/schemas/Journal'
 *                     streak:
 *                       type: object
 *                       properties:
 *                         streakCount:
 *                           type: integer
 *                           example: 5
 *                         bestStreak:
 *                           type: integer
 *                           example: 15
 *                         lastStreakDate:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad Request - Missing content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: fail
 *               message: Thiếu content
 *               statusCode: 400
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *
 *   get:
 *     tags: [Journals]
 *     summary: Get my journals (paginated with filters) | Xem các nhật ký của tôi
 *     description: Retrieve user's journals with pagination and filtering options | Lấy danh sách nhật ký của bạn
 *     security:
 *       - bearer: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *         description: Page number (starts at 1)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10, maximum: 50 }
 *         description: Number of entries per page (max 50)
 *       - in: query
 *         name: q
 *         schema: { type: string, example: "growth" }
 *         description: Search query (searches in title and content)
 *       - in: query
 *         name: mood
 *         schema:
 *           type: string
 *           enum: [happy, sad, angry, anxious, neutral, excited, tired]
 *           example: happy
 *         description: Filter by mood
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *           enum: [personal, growth, achievement, reflection, healing, relationships, career, health, creative, gratitude]
 *           example: growth
 *         description: Filter by tag (select from predefined list)
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time, example: "2026-03-01T00:00:00.000Z" }
 *         description: Start date for date range filter
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time, example: "2026-03-10T23:59:59.999Z" }
 *         description: End date for date range filter
 *     responses:
 *       200:
 *         description: Journal list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Unauthorized - Token missing or invalid
 */
router.post("/", protect, journalController.createJournal);
router.get("/", protect, journalController.getMyJournals);

/**
 * @openapi
 * /api/v1/journals/{id}:
 *   get:
 *     tags: [Journals]
 *     summary: Get journal entry details | Xem chi tiết nhật ký
 *     description: Retrieve a specific journal entry by ID | Lấy toàn bộ nội dung của một bài nhật ký cụ thể
 *     security:
 *       - bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Journal ID (MongoDB ObjectId)
 *         example: 65d0f3b5a5a5a5a5a5a5a5b6
 *     responses:
 *       200:
 *         description: Journal retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     journal:
 *                       $ref: '#/components/schemas/Journal'
 *       400:
 *         description: Bad Request - Invalid journal ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: fail
 *               message: id không hợp lệ
 *               statusCode: 400
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Journal not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: fail
 *               message: Không tìm thấy nhật ký
 *               statusCode: 404
 *
 *   patch:
 *     tags: [Journals]
 *     summary: Update journal entry | Cập nhật nhật ký
 *     description: Update journal entry with new content, mood, tags, or date | Chỉnh sửa bài nhật ký
 *     security:
 *       - bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Journal ID
 *         example: 65d0f3b5a5a5a5a5a5a5a5b6
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Update journal title
 *                 example: Updated Journal Title
 *               content:
 *                 type: string
 *                 description: Update journal content
 *                 example: Updated content text...
 *               mood:
 *                 type: string
 *                 enum: [happy, sad, angry, anxious, neutral, excited, tired]
 *                 description: Update mood
 *                 example: excited
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [personal, growth, achievement, reflection, healing, relationships, career, health, creative, gratitude]
 *                 description: Update tags (select from predefined list)
 *                 example: [personal, growth]
 *               entryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Update entry date
 *                 example: "2026-03-05T14:00:00.000Z"
 *     responses:
 *       200:
 *         description: Journal updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     journal:
 *                       $ref: '#/components/schemas/Journal'
 *       400:
 *         description: Bad Request - Invalid ID or data
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Journal not found or update failed
 *
 *   delete:
 *     tags: [Journals]
 *     summary: Delete journal entry (soft delete) | Xóa nhật ký
 *     description: Soft delete a journal entry (marks as deleted, doesn't remove from DB) | Xóa nhật ký (đánh dấu xóa, không xóa vĩnh viễn)
 *     security:
 *       - bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Journal ID
 *         example: 65d0f3b5a5a5a5a5a5a5a5b6
 *     responses:
 *       200:
 *         description: Journal deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Journal deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     journal:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: 65d0f3b5a5a5a5a5a5a5a5b6
 *                         title:
 *                           type: string
 *                           example: My First Day
 *                         deletedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-03-06T10:30:00.000Z"
 *                         isDeleted:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Bad Request - Invalid journal ID format
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Journal not found
 */
router.get("/:id", protect, journalController.getJournal);
router.patch("/:id", protect, journalController.updateJournal);
router.delete("/:id", protect, journalController.deleteJournal);

/**
 * @openapi
 * /api/v1/journals/{id}/visibility:
 *   patch:
 *     tags: [Journals]
 *     summary: Update journal visibility (public/private) | Thay đổi chế độ công khai/riêng tư
 *     description: Toggle journal between public and private visibility | Chia sẻ công khai hoặc ẩn riêng tư
 *     security:
 *       - bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Journal ID
 *         example: 65d0f3b5a5a5a5a5a5a5a5b6
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isPublic]
 *             properties:
 *               isPublic:
 *                 type: boolean
 *                 description: Make journal public (true) or private (false)
 *                 example: true
 *     responses:
 *       200:
 *         description: Journal visibility updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     journal:
 *                       $ref: '#/components/schemas/Journal'
 *       400:
 *         description: Bad Request - Invalid isPublic value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: fail
 *               message: isPublic phải là boolean
 *               statusCode: 400
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Journal not found
 */

/**
 * @openapi
 * /api/v1/journals/{id}/restore:
 *   patch:
 *     tags: [Journals]
 *     summary: Restore a soft-deleted journal | Khôi phục nhật ký đã xóa
 *     description: Restore a journal entry that was previously soft-deleted | Khôi phục bài nhật ký đã xóa trước đó
 *     security:
 *       - bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Journal ID
 *         example: 65d0f3b5a5a5a5a5a5a5a5b6
 *     responses:
 *       200:
 *         description: Journal restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Journal restored successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     journal:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: 65d0f3b5a5a5a5a5a5a5a5b6
 *                         title:
 *                           type: string
 *                           example: My First Day
 *                         content:
 *                           type: string
 *                           example: Today was an amazing day...
 *                         deletedAt:
 *                           type: "null"
 *                           example: null
 *                         isDeleted:
 *                           type: boolean
 *                           example: false
 *       400:
 *         description: Bad Request - Invalid journal ID format
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Deleted journal not found
 */
router.patch(
  "/:id/restore",
  protect,
  journalController.restoreJournal,
);

router.patch(
  "/:id/visibility",
  protect,
  journalController.updateJournalVisibility,
);

module.exports = router;
