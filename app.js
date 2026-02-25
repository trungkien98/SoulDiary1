const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const setupSwagger = require("./swagger");
const authRouter = require("./routes/authRouter");
const journalRouter = require("./routes/journalRouter");
const globalErrorController = require("./controller/errorController");
const mailTestRoutes = require("./routes/mailTestRouter");
const otpRouter = require("./routes/otpRouter");
const userRouter = require("./routes/userRouter");
const whiteList = (process.env.FE_ADMIN_CLIENT_HOST || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

whiteList.push(
  "https://souldiary1.onrender.com",
  "http://localhost:8081",
  "http://localhost:5173",
  "http://localhost:4200",
  "http://localhost:3000",
);
app.use(
  cors({
    origin: (origin, cb) => {
      // Mobile/Postman không có Origin
      if (!origin) return cb(null, true);

      if (whiteList.includes(origin)) return cb(null, true);

      return cb(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(cookieParser());

setupSwagger(app);

// routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/journals", journalRouter);
app.use("/api/v1/mail", mailTestRoutes);
app.use("/api/v1/otp", otpRouter);
app.use("/api/v1/users", userRouter);
app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.use(globalErrorController);

module.exports = app;
