const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const setupSwagger = require("./swagger");
const authRouter = require("./routes/authRouter");
const journalRouter = require("./routes/journalRouter");
const globalErrorController = require("./controller/errorController");
const whiteList = (process.env.FE_ADMIN_CLIENT_HOST || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

whiteList.push(
  "http://localhost:8081",
  "http://localhost:5173",
  "http://localhost:4200",
  "http://localhost:3000",
);
app.use(express.json());
app.use(cookieParser());
setupSwagger(app);

//route
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/journals", journalRouter);
app.use((req, res) => {
  res.status(404).send("Not Found");
});
app.use(globalErrorController);
module.exports = app;
