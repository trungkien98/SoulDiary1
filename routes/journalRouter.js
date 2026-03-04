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
 *               title: { type: string, example: "Ngày đầu làm CRUD" }
 *               content: { type: string, example: "Hôm nay mình làm được CRUD nhật ký" }
 *               mood:
 *                 type: string
 *                 enum: [happy, sad, angry, anxious, neutral, excited, tired]
 *                 example: happy
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["dev", "souldiary"]
 *               entryDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-02-03T10:00:00.000Z"
 *               isPublic:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       401:
 *         description: Chưa đăng nhập / token không hợp lệ
 *
 *   get:
 *     tags: [Journals]
 *     summary: Lấy danh sách nhật ký của tôi (có phân trang + filter)
 *     security:
 *       - bearer: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *       - in: query
 *         name: q
 *         schema: { type: string, example: CRUD }
 *       - in: query
 *         name: mood
 *         schema:
 *           type: string
 *           enum: [happy, sad, angry, anxious, neutral, excited, tired]
 *           example: happy
 *       - in: query
 *         name: tag
 *         schema: { type: string, example: healing }
 *       - in: query
 *         name: from
 *         schema: { type: string, example: "2026-02-01T00:00:00.000Z" }
 *       - in: query
 *         name: to
 *         schema: { type: string, example: "2026-02-28T23:59:59.999Z" }
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Chưa đăng nhập / token không hợp lệ
 */
router.post("/", protect, journalController.createJournal);
router.get("/", protect, journalController.getMyJournals);

/**
 * @openapi
 * /api/v1/journals/{id}/visibility:
 *   patch:
 *     tags: [Journals]
 *     summary: Cập nhật trạng thái public/private của nhật ký
 *     security:
 *       - bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isPublic]
 *             properties:
 *               isPublic: { type: boolean, example: true }
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: isPublic không hợp lệ
 *       401:
 *         description: Chưa đăng nhập / token không hợp lệ
 *       404:
 *         description: Không tìm thấy nhật ký
 */
router.patch(
  "/:id/visibility",
  protect,
  journalController.updateJournalVisibility,
);

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
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Chưa đăng nhập / token không hợp lệ
 *       404:
 *         description: Không tìm thấy nhật ký
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
 *         schema: { type: string }
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
 *       401:
 *         description: Chưa đăng nhập / token không hợp lệ
 *       404:
 *         description: Không tìm thấy nhật ký
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
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Xóa thành công (no content)
 *       401:
 *         description: Chưa đăng nhập / token không hợp lệ
 *       404:
 *         description: Không tìm thấy nhật ký
 */
router.get("/:id", protect, journalController.getJournal);
router.patch("/:id", protect, journalController.updateJournal);
router.delete("/:id", protect, journalController.deleteJournal);

module.exports = router;
