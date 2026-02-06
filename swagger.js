const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// 👇 Dùng env RIÊNG cho Swagger
const swaggerUrl = process.env.SWAGGER_SERVER_URL || "http://localhost:3000";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Soul Diary Flow Documentation",
    version: "1.0.0",
    description:
      "This is a REST API application made with Express. It retrieves data from a MongoDB database and applies CRUD operations on it.",
  },
  servers: [
    {
      url: swaggerUrl,
      description: "API Server",
    },
  ],
  components: {
    securitySchemes: {
      bearer: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ["./routes/*.js", "./app.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
