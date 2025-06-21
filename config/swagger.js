const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sudhama Seva API Documentation",
      version: "1.0.0",
      description: `
## NGO Donation Management System API

This API provides a complete solution for managing donors and donations for NGOs. The system is designed to be simple and accessible to all users without role-based restrictions.

### Key Features:
- **Donor Management**: Create and manage donors with location tracking
- **Group-based Organization**: Categorize donors by geographical areas
- **Monthly Collection Tracking**: Track monthly donations from donors
- **Automatic Status Updates**: System automatically flags donors who miss collection dates
- **Simple Access Control**: All authenticated users have full access to all data

### System Overview:
1. **Donors** are individuals who make monthly donations
2. **Groups** represent geographical areas for organizing donors
3. **Donations** are monthly contributions tracked with amounts and dates
4. **Status Management** automatically updates donor statuses based on collection dates

### Authentication:
All endpoints require JWT authentication. Include the token in the Authorization header:
\`Authorization: Bearer <your-jwt-token>\`

### Response Format:
All API responses follow this standardized format:
\`\`\`json
{
  "success": true/false,
  "message": "Human readable message",
  "data": { ... },  // Present only in success responses
  "errors": [ ... ] // Present only in error responses
}
\`\`\`

### Error Codes:
- 400: Bad Request - Invalid input or validation error
- 401: Unauthorized - Missing or invalid authentication
- 403: Forbidden - Not allowed to access the resource
- 404: Not Found - Resource doesn't exist
- 409: Conflict - Resource already exists or state conflict
- 500: Internal Server Error - Unexpected server error

### Error Handling:
The API uses consistent error responses across all endpoints:

1. **Validation Errors** (400):
\`\`\`json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "mobileNumber",
      "message": "Please enter a valid 10-digit mobile number"
    }
  ]
}
\`\`\`

2. **Authentication Errors** (401):
\`\`\`json
{
  "success": false,
  "message": "Authentication failed",
  "errors": [
    {
      "code": "INVALID_TOKEN",
      "message": "Token has expired"
    }
  ]
}
\`\`\`

3. **Resource Not Found** (404):
\`\`\`json
{
  "success": false,
  "message": "Resource not found",
  "error": "The requested resource does not exist"
}
\`\`\`

4. **Duplicate Entry** (409):
\`\`\`json
{
  "success": false,
  "message": "Resource already exists",
  "error": "A donor with this hundi number already exists"
}
\`\`\`

5. **Server Error** (500):
\`\`\`json
{
  "success": false,
  "message": "Something went wrong",
  "error": "Detailed error message in development mode only"
}
\`\`\`
      `,
      contact: {
        name: "API Support",
        email: "support@sudhamaseva.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://sudhama-seva-app-server.onrender.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from login endpoint",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error occurred while processing your request",
            },
            error: {
              type: "string",
              description: "Detailed error message (only in development mode)",
              example: "Detailed error information",
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Operation completed successfully",
            },
            data: {
              type: "object",
              description: "Response data object",
            },
          },
        },
        ValidationError: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Validation failed",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    example: "mobileNumber",
                  },
                  message: {
                    type: "string",
                    example: "Please enter a valid 10-digit mobile number",
                  },
                },
              },
            },
          },
        },
        AuthError: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Authentication failed",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: {
                    type: "string",
                    example: "INVALID_TOKEN",
                  },
                  message: {
                    type: "string",
                    example: "Token has expired",
                  },
                },
              },
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            total: {
              type: "integer",
              description: "Total number of items",
            },
            page: {
              type: "integer",
              description: "Current page number",
            },
            pages: {
              type: "integer",
              description: "Total number of pages",
            },
            limit: {
              type: "integer",
              description: "Number of items per page",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Auth",
        description: "Authentication endpoints",
      },
      {
        name: "Donors",
        description: "Donor management endpoints",
      },
      {
        name: "Donations",
        description: "Donation tracking endpoints",
      },
      {
        name: "Groups",
        description: "Group management endpoints",
      },
    ],
  },
  apis: ["./routes/*.js", "./models/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
