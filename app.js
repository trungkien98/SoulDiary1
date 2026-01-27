const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const setupSwagger = require("./swagger");
const authRouter = require("./routes/authRouter");
app.use(express.json());
app.use(cookieParser());
setupSwagger(app);
/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *               example:
 *                 ok: true
 */
app.get("/health", (req, res) => res.json({ ok: true }));

//route
app.use("/api/v1/auth", authRouter);
app.use((req, res) => {
  res.status(404).send("Not Found");
});

module.exports = app;
