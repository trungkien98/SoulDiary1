const express = require("express");
const journalController = require("../controller/journalController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Journals
 *     description: CRUD nhật ký (yêu cầu đăng nhập)
 */

/**
 * @openapi
 * /api/v1/journals:
 *   post:
 *     tags: [Journals]
 *     summary: Tạo nhật ký
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
 *                 example: "Ngày đầu làm CRUD"
 *               content:
 *                 type: string
 *                 example: "Hôm nay mình làm được CRUD nhật ký"
 *               mood:
 *                 type: string
 *                 example: happy
 *                 enum: [happy, sad, angry, anxious, neutral, excited, tired]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["dev", "souldiary"]
 *               entryDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-02-03T10:00:00.000Z"
 *     responses:
 *       201:
 *         description: Tạo thành công
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
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "65c0f5c2f8b3c0a9b1234567"
 *                         user:
 *                           type: string
 *                           example: "65bff1c2f8b3c0a9b7654321"
 *                         title:
 *                           type: string
 *                           example: "Một ngày bình yên"
 *                         content:
 *                           type: string
 *                           example: "Hôm nay mình thấy nhẹ lòng hơn..."
 *                         mood:
 *                           type: string
 *                           example: happy
 *                           enum: [happy, sad, angry, anxious, neutral, excited, tired]
 *                         tags:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["healing", "work"]
 *                         entryDate:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-02-03T10:00:00.000Z"
 *                         isDeleted:
 *                           type: boolean
 *                           example: false
 *                         deletedAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Chưa đăng nhập / token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: "Bạn chưa đăng nhập"
 *
 *   get:
 *     tags: [Journals]
 *     summary: Lấy danh sách nhật ký của tôi (có phân trang + filter)
 *     security:
 *       - bearer: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: q
 *         description: Từ khóa tìm kiếm (title/content/tags)
 *         schema:
 *           type: string
 *           example: CRUD
 *       - in: query
 *         name: mood
 *         schema:
 *           type: string
 *           example: happy
 *           enum: [happy, sad, angry, anxious, neutral, excited, tired]
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *           example: healing
 *       - in: query
 *         name: from
 *         description: Lọc từ ngày (ISO date/time)
 *         schema:
 *           type: string
 *           example: "2026-02-01T00:00:00.000Z"
 *       - in: query
 *         name: to
 *         description: Lọc đến ngày (ISO date/time)
 *         schema:
 *           type: string
 *           example: "2026-02-28T23:59:59.999Z"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 42
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 results:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: object
 *                   properties:
 *                     journals:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id: { type: string }
 *                           user: { type: string }
 *                           title: { type: string }
 *                           content: { type: string }
 *                           mood:
 *                             type: string
 *                             enum: [happy, sad, angry, anxious, neutral, excited, tired]
 *                           tags:
 *                             type: array
 *                             items: { type: string }
 *                           entryDate:
 *                             type: string
 *                             format: date-time
 *                           isDeleted: { type: boolean }
 *                           deletedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Chưa đăng nhập / token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: "Bạn chưa đăng nhập"
 */

router.use(protect);

router
  .route("/")
  .post(journalController.createJournal)
  .get(journalController.getMyJournals);

/**
 * @openapi
 * /api/v1/journals/{id}:
 *   get:
 *     tags: [Journals]
 *     summary: Lấy chi tiết 1 nhật ký
 *     security:
 *       - bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
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
 *                       type: object
 *                       properties:
 *                         _id: { type: string }
 *                         user: { type: string }
 *                         title: { type: string }
 *                         content: { type: string }
 *                         mood:
 *                           type: string
 *                           enum: [happy, sad, angry, anxious, neutral, excited, tired]
 *                         tags:
 *                           type: array
 *                           items: { type: string }
 *                         entryDate:
 *                           type: string
 *                           format: date-time
 *                         isDeleted: { type: boolean }
 *                         deletedAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Chưa đăng nhập / token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: "Bạn chưa đăng nhập"
 *       404:
 *         description: Không tìm thấy tài nguyên
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: fail }
 *                 message: { type: string, example: "Không tìm thấy nhật ký" }
 *
 *   patch:
 *     tags: [Journals]
 *     summary: Cập nhật nhật ký
 *     security:
 *       - bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *               mood:
 *                 type: string
 *                 enum: [happy, sad, angry, anxious, neutral, excited, tired]
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *               entryDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     journal:
 *                       type: object
 *                       properties:
 *                         _id: { type: string }
 *                         user: { type: string }
 *                         title: { type: string }
 *                         content: { type: string }
 *                         mood:
 *                           type: string
 *                           enum: [happy, sad, angry, anxious, neutral, excited, tired]
 *                         tags:
 *                           type: array
 *                           items: { type: string }
 *                         entryDate:
 *                           type: string
 *                           format: date-time
 *                         isDeleted: { type: boolean }
 *                         deletedAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Chưa đăng nhập / token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: fail }
 *                 message: { type: string, example: "Bạn chưa đăng nhập" }
 *       404:
 *         description: Không tìm thấy tài nguyên
 *
 *   delete:
 *     tags: [Journals]
 *     summary: Xóa nhật ký (soft delete)
 *     security:
 *       - bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Xóa thành công (no content)
 *       401:
 *         description: Chưa đăng nhập / token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: fail }
 *                 message: { type: string, example: "Bạn chưa đăng nhập" }
 *       404:
 *         description: Không tìm thấy tài nguyên
 */

router
  .route("/:id")
  .get(journalController.getJournal)
  .patch(journalController.updateJournal)
  .delete(journalController.deleteJournal);

module.exports = router;
