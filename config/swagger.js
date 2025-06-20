const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sudhama Seva API Documentation',
      version: '1.0.0',
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
All API responses follow this format:
\`\`\`json
{
  "success": true/false,
  "message": "Human readable message",
  "data": { ... }
}
\`\`\`
      `,
      contact: {
        name: 'API Support',
        email: 'support@sudhamaseva.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://sudhama-seva-app-server.onrender.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of items'
            },
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            pages: {
              type: 'integer',
              description: 'Total number of pages'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints'
      },
      {
        name: 'Donors',
        description: 'Donor management endpoints'
      },
      {
        name: 'Donations',
        description: 'Donation tracking endpoints'
      },
      {
        name: 'Groups',
        description: 'Group management endpoints'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './models/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;