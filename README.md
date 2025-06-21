# Sudhama Seva App Backend

A simplified donation management system for NGOs where all users have access to all data.

## Features

- **Donor Management**: Create, update, and manage donors with basic information
- **Group-based Organization**: Categorize donors by location/area groups
- **Monthly Collection Tracking**: Track monthly donations from donors
- **Automatic Status Updates**: Cron job automatically sets donor status to pending when collection date is missed
- **Simple Access Control**: All authenticated users can access all data (no role-based restrictions)

## System Logic

### Donor Management
- Each donor has basic info: name, mobile number, address, Google Maps location
- Donors are assigned to groups (representing geographical areas)
- Each donor has a collection date and status (pending, collected, skipped)

### Collection Process
- Donations are collected monthly from each donor
- When a donation is recorded, the next collection date is automatically set to one month later
- When a donation is skipped, the next collection date is set to one month from the skip date

### Automatic Status Management
- A daily cron job runs at midnight to check donor statuses
- If a donor's collection date has passed AND they don't have a donation for the current month, their status is set to "pending"
- This ensures donors who miss their collection date are flagged for follow-up

### Data Access
- All authenticated users can view, create, update, and delete all data
- No role-based restrictions - this is designed for NGO use where all team members need full access

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Donors
- `GET /api/donors` - Get all donors with pagination and filters
- `POST /api/donors` - Create new donor
- `GET /api/donors/:id` - Get donor by ID
- `PUT /api/donors/:id` - Update donor
- `DELETE /api/donors/:id` - Delete donor
- `GET /api/donors/:id/status` - Get donor status with recent donations
- `PUT /api/donors/:id/status` - Update donor status
- `POST /api/donors/trigger-status-update` - Manually trigger status update (for testing)

### Donations
- `GET /api/donations` - Get all donations with filters
- `POST /api/donations` - Create new donation record
- `POST /api/donations/skip` - Skip donation for a donor

### Groups
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create new group
- `GET /api/groups/:id` - Get group with its donors
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

## Environment Variables

Create a `.env` file with the following variables:

```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
CORS_ORIGIN=*
NODE_ENV=development
```

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start the server: `npm run dev` (development) or `npm start` (production)

## Cron Job

The system includes a daily cron job that runs at midnight to automatically update donor statuses. The job:

1. Finds donors whose collection date has passed
2. Checks if they have a donation for the current month
3. If no donation exists, sets their status to "pending"

You can manually trigger this process using the `/api/donors/trigger-status-update` endpoint for testing purposes.

## Data Models

### Donor
- Basic info (name, mobile, address, Google Maps link)
- Group assignment
- Collection date
- Status (pending, collected, skipped)
- Status history
- Created by user

### Donation
- Donor reference
- Amount
- Collection date and time
- Notes
- Collected by user

### Group
- Name
- Area description
- Description
- Created by user

### User
- Name, email, password
- Active status
- Last login
- No role-based restrictions

## Production API
Base URL: `https://sudhama-seva-app-server.onrender.com`

## API Documentation
Swagger documentation is available at:
- Development: `http://localhost:3000/api-docs`
- Production: `https://sudhama-seva-app-server.onrender.com/api-docs`

## Tech Stack
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Swagger Documentation

## Prerequisites
- Node.js >= 14.x
- MongoDB
- npm or yarn

## API Overview

### Authentication Endpoints
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- GET `/api/auth/profile` - Get user profile

### Donor Management
- POST `/api/donors` - Create new donor
- GET `/api/donors` - Get all donors (with pagination & filters)
- GET `/api/donors/:id` - Get donor by ID
- PUT `/api/donors/:id` - Update donor
- DELETE `/api/donors/:id` - Delete donor

### Group Management
- POST `/api/groups` - Create new group
- GET `/api/groups` - Get all groups (with pagination & filters)
- GET `/api/groups/:id` - Get group by ID with its donors
- PUT `/api/groups/:id` - Update group
- DELETE `/api/groups/:id` - Delete group
- POST `/api/groups/:id/assign` - Assign donors to group

### Donation Management
- POST `/api/donations` - Create new donation record
- GET `/api/donations` - Get all donations (with pagination & filters)
- PUT `/api/donations/:id` - Update donation
- DELETE `/api/donations/:id` - Delete donation

## Security Features
- Password hashing with bcrypt
- JWT token expiration
- Rate limiting
- Input validation
- XSS protection
- Security headers
- CORS configuration

## Error Handling
- Validation errors
- Authentication errors
- Database errors
- Rate limiting errors
- Generic error handling middleware

## Contributing
Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License
This project is private and proprietary. Unauthorized copying or distribution is prohibited.

## Support
For support, please contact the development team.