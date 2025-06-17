# Sudhama Seva App Backend

Backend API service for the Sudhama Seva application, managing donor tracking and donation collection system.

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

## Installation & Setup

1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Environment Variables
Create a `.env` file in the root directory with the following variables:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d
CORS_ORIGIN=*
```

4. Start the server
```bash
# Development
npm run dev

# Production
npm start
```

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
- GET `/api/donations/monthly-status` - Get monthly donation status
- PUT `/api/donations/:id` - Update donation
- DELETE `/api/donations/:id` - Delete donation
- POST `/api/donations/initialize-monthly` - Initialize monthly donations

## Features
- JWT-based authentication
- Role-based access control (Admin/User)
- Request validation & sanitization
- Rate limiting for API protection
- MongoDB connection with retry mechanism
- Automated monthly donation initialization
- Comprehensive error handling
- API documentation with Swagger
- CORS enabled
- Security headers with Helmet
- Request logging with Morgan

## Data Models

### User
- name (String, required)
- email (String, required, unique)
- password (String, required)
- role (String, enum: ['user', 'admin'])
- isActive (Boolean)
- lastLogin (Date)

### Donor
- hundiNo (String, required, unique)
- name (String, required)
- mobileNumber (String, required)
- address (String, required)
- googleMapLink (String)
- group (ObjectId, ref: 'Group')
- isActive (Boolean)
- createdBy (ObjectId, ref: 'User')

### Group
- name (String, required, unique)
- description (String)
- area (String, required)
- createdBy (ObjectId, ref: 'User')

### Donation
- donor (ObjectId, ref: 'Donor')
- amount (Number)
- collectionDate (Date)
- collectionTime (String)
- collectionMonth (String)
- status (String, enum: ['pending', 'collected', 'skipped'])
- collectedBy (ObjectId, ref: 'User')
- notes (String)

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