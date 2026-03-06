const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Soul Diary API",
    version: "1.0.0",
    description: "REST API for Soul Diary - Journaling Application (Ứng dụng nhật ký cá nhân)",
  },
  servers: [
    {
      url: process.env.SWAGGER_SERVER_URL || "http://localhost:3000",
      description: "Development Server",
    },
  ],
  security: [
    {
      bearer: [],
    },
  ],
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            description: "User ID (ID người dùng)",
            example: "65d0f3b5a5a5a5a5a5a5a5a5",
          },
          name: {
            type: "string",
            description: "User's full name (Tên đầy đủ)",
            example: "John Doe",
          },
          email: {
            type: "string",
            format: "email",
            description: "User's email address (Địa chỉ email)",
            example: "john@example.com",
          },
          avatar: {
            type: "string",
            description: "User's avatar URL (Ảnh đại diện)",
            example: "https://example.com/avatar.jpg",
          },
          role: {
            type: "string",
            enum: ["user", "admin"],
            description: "User role (Vai trò)",
            example: "user",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Account creation date (Ngày tạo tài khoản)",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Last update date (Ngày cập nhật cuối cùng)",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["fail", "error"],
            description: "Response status (Trạng thái phản hồi)",
            example: "fail",
          },
          message: {
            type: "string",
            description: "Error message (Thông báo lỗi)",
            example: "Invalid request",
          },
          statusCode: {
            type: "integer",
            description: "HTTP status code (Mã trạng thái HTTP)",
            example: 400,
          },
        },
        required: ["status", "message", "statusCode"],
      },
      Journal: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            description: "Journal entry ID (ID nhật ký)",
            example: "65d0f3b5a5a5a5a5a5a5a5a5",
          },
          user: {
            type: "string",
            description: "User ID who created the journal (ID người tạo))",
            example: "65d0f3b5a5a5a5a5a5a5a5a5",
          },
          title: {
            type: "string",
            description: "Journal entry title (Tiêu đề)",
            example: "My First Day",
          },
          content: {
            type: "string",
            description: "Main journal content (Nội dung chính)",
            example: "Today was an amazing day filled with personal growth and reflection...",
          },
          mood: {
            type: "string",
            enum: ["happy", "sad", "angry", "anxious", "neutral", "excited", "tired"],
            description: "Emotional mood of the entry (Tâm trạng)",
            example: "happy",
          },
          tags: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Tags to organize journals (Thẻ phân loại)",
            example: ["personal", "growth", "achievement"],
          },
          entryDate: {
            type: "string",
            format: "date-time",
            description: "Date of the journal entry (Ngày ghi nhập)",
            example: "2026-03-05T10:00:00.000Z",
          },
          isPublic: {
            type: "boolean",
            description: "Whether journal is public or private (Công khai hay riêng tư)",
            example: false,
          },
          isDeleted: {
            type: "boolean",
            description: "Soft delete status (Trạng thái xóa)",
            example: false,
          },
          deletedAt: {
            type: "string",
            format: "date-time",
            description: "Date when journal was deleted (null if not deleted) (Ngày xóa)",
            nullable: true,
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Journal creation timestamp (Ngày tạo)",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Journal last update timestamp (Ngày cập nhật)",
          },
        },
      },
      PaginatedResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            example: "success",
          },
          data: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Journal",
            },
          },
          pagination: {
            type: "object",
            properties: {
              page: {
                type: "integer",
                example: 1,
              },
              limit: {
                type: "integer",
                example: 10,
              },
              totalPages: {
                type: "integer",
                example: 5,
              },
              totalResults: {
                type: "integer",
                example: 47,
              },
            },
          },
        },
      },
      TokenResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            example: "success",
          },
          token: {
            type: "object",
            properties: {
              access_token: {
                type: "string",
                description: "JWT access token for authenticating requests",
                example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1ZDBmM2I1YTVhNWE1YTVhNWE1YTVhNSIsImlhdCI6MTcwODM5OTUyOH0.xyz",
              },
              refresh_token: {
                type: "string",
                description: "JWT refresh token for obtaining new access tokens",
                example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1ZDBmM2I1YTVhNWE1YTVhNWE1YTVhNSIsImlhdCI6MTcwODM5OTUyOH0.abc",
              },
            },
            required: ["access_token", "refresh_token"],
          },
          data: {
            type: "object",
            properties: {
              user: {
                $ref: "#/components/schemas/User",
              },
            },
          },
        },
      },
    },
    securitySchemes: {
      bearer: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT authentication token (Token xác thực JWT)",
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerOptions = {
  persistAuthorization: true, // Keep bearer token after page refresh
};

module.exports = (app) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerOptions),
  );
};
