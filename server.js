require("dotenv").config();

const app = require("./app");
const database = require("./config/db");

const startServer = async () => {
  try {
    await database.connect();
    
    const port = process.env.PORT || 3000;
    const server = app.listen(port, "0.0.0.0", () => {
      if (process.env.NODE_ENV !== "production") {
        console.log(`Server running on port ${port}`);
        console.log("✅ Server is listening and ready to accept requests");
      }
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.error("❌ Unhandled Rejection:", err);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (err) => {
      console.error("❌ Uncaught Exception:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  }
};

startServer().catch((err) => {
  console.error("Failed to start server (catch):", err);
  process.exit(1);
});
