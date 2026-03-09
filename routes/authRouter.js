// routes/authRouter.js
const express = require("express");
const authController = require("../controller/authController");

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication APIs (Register, Login, OAuth) | Các API xác thực (Đăng ký, Đăng nhập, OAuth)
 */

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Register with Email & Password | Đăng ký bằng Email & Mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: Nguyen Van A
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password (minimum 8 characters)
 *                 minLength: 8
 *                 example: MySecurePassword123!
 *     responses:
 *       201:
 *         description: Registration successful - Verification email sent
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
 *                   example: Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Thiếu email hoặc password
 *               statusCode: 400
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Email đã tồn tại
 *               statusCode: 409
 */
router.post("/register", authController.register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Login with Email & Password | Đăng nhập bằng Email & Mật khẩu
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
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: MySecurePassword123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials or account not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Sai email hoặc mật khẩu
 *               statusCode: 401
 */
router.post("/login", authController.login);

/**
 * @openapi
 * /api/v1/auth/google:
 *   post:
 *     summary: Login with Google (OAuth) | Đăng nhập với Google
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
 *                 description: Google ID Token from client (from google-auth-library)
 *                 example: eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhdWQiOiJjbGllbnRfaWQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwicGljdHVyZSI6Imh0dHBzOi8vZXhhbXBsZS5jb20vcGhvdG8uanBnIn0.sig
 *     responses:
 *       200:
 *         description: Google login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Missing idToken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/google", authController.googleLogin);

/**
 * @openapi
 * /api/v1/auth/facebook:
 *   post:
 *     summary: Login with Facebook (OAuth) | Đăng nhập với Facebook
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
 *                 description: Facebook access token from client
 *                 example: EAASDFASDFASDFASDFASDFASDFASDFASDFASDFASDF
 *     responses:
 *       200:
 *         description: Facebook login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Missing accessToken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/facebook", authController.facebookLogin);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user | Đăng xuất
 *     tags: [Auth]
 *     security:
 *       - bearer: []
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: Logged out successfully
 *       401:
 *         description: Unauthorized - No token provided
 */
router.post("/logout", authController.logout);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token | Làm mới token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token from login response
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1ZDBmM2I1YTVhNWE1YTVhNWE1YTVhNSIsImlhdCI6MTcwODM5OTUyOH0.abc
 *     responses:
 *       200:
 *         description: New access token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 token:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", authController.refresh);

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset (sends OTP to email) | Quên mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Reset OTP sent to email
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
 *                   example: OTP sent to your email
 *       404:
 *         description: User not found
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @openapi
 * /api/v1/auth/google-oauth:
 *   get:
 *     summary: Browser-based Google OAuth - Redirect to Google consent | OAuth qua trình duyệt Web
 *     tags: [Auth]
 *     parameters:
 *       - name: redirect
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: App redirect URI after OAuth (e.g., souldiary://oauth-callback)
 *         example: souldiary://oauth-callback
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth consent screen
 */
router.get("/google-oauth", authController.googleOAuthBrowser);

/**
 * @openapi
 * /api/v1/auth/google-oauth-callback:
 *   get:
 *     summary: Google OAuth callback - Handle authorization code exchange
 *     tags: [Auth]
 *     parameters:
 *       - name: code
 *         in: query
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *       - name: state
 *         in: query
 *         schema:
 *           type: string
 *         description: State parameter for CSRF protection
 *       - name: error
 *         in: query
 *         schema:
 *           type: string
 *         description: Error code if user denies access
 *       - name: redirect
 *         in: query
 *         schema:
 *           type: string
 *         description: App redirect URI
 *     responses:
 *       302:
 *         description: Redirect back to app with token or error
 */
router.get("/google-oauth-callback", authController.googleOAuthCallback);

/**
 * @openapi
 * /api/v1/auth/facebook-oauth:
 *   get:
 *     summary: Browser-based Facebook OAuth - Redirect to Facebook consent | OAuth qua trình duyệt Web
 *     tags: [Auth]
 *     parameters:
 *       - name: redirect
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: App redirect URI after OAuth (e.g., souldiary://oauth-callback)
 *         example: souldiary://oauth-callback
 *     responses:
 *       302:
 *         description: Redirect to Facebook OAuth consent screen
 */
router.get("/facebook-oauth", authController.facebookOAuthBrowser);

/**
 * @openapi
 * /api/v1/auth/facebook-oauth-callback:
 *   get:
 *     summary: Facebook OAuth callback - Handle authorization code exchange
 *     tags: [Auth]
 *     parameters:
 *       - name: code
 *         in: query
 *         schema:
 *           type: string
 *         description: Authorization code from Facebook
 *       - name: state
 *         in: query
 *         schema:
 *           type: string
 *         description: State parameter for CSRF protection
 *       - name: error
 *         in: query
 *         schema:
 *           type: string
 *         description: Error code if user denies access
 *       - name: redirect
 *         in: query
 *         schema:
 *           type: string
 *         description: App redirect URI
 *     responses:
 *       302:
 *         description: Redirect back to app with token or error
 */
router.get("/facebook-oauth-callback", authController.facebookOAuthCallback);

module.exports = router;
