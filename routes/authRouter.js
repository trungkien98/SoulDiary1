// routes/authRouter.js
const express = require("express");
const authController = require("../controller/authController");

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication APIs
 */

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Register (email/password)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Soul Diary
 *               email:
 *                 type: string
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 example: 12345678
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/register", authController.register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Login (email/password)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 example: 12345678
 *     responses:
 *       200:
 *         description: OK
 */
router.post("/login", authController.login);

/**
 * @openapi
 * /api/v1/auth/google:
 *   post:
 *     summary: Login with Google (client sends idToken)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID Token from client
 *     responses:
 *       200:
 *         description: OK
 */
router.post("/google", authController.googleLogin);

/**
 * @openapi
 * /api/v1/auth/facebook:
 *   post:
 *     summary: Login with Facebook (client sends accessToken)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accessToken]
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Facebook Access Token from client
 *     responses:
 *       200:
 *         description: OK
 */
router.post("/facebook", authController.facebookLogin);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token (web uses cookie refreshToken, mobile can send body.refreshToken)
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Only needed for mobile if not using cookie
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh", authController.refresh);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout (clear refresh cookie, optionally revoke refresh in DB)
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Optional for mobile to revoke refresh token
 *     responses:
 *       200:
 *         description: OK
 */
router.post("/logout", authController.logout);

module.exports = router;
