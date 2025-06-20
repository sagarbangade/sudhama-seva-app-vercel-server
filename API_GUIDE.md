# Sudhama Seva API Guide for Frontend Developers

## 🚀 Quick Start

### Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://sudhama-seva-app-server.onrender.com`

### Authentication
All API endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Response Format
All API responses follow this consistent format:
```json
{
  "success": true/false,
  "message": "Human readable message",
  "data": { ... }
}
```

## 📋 API Endpoints Overview

### 🔐 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get current user profile |

### 👥 Donors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/donors` | Get all donors (with filters) |
| POST | `/api/donors` | Create new donor |
| GET | `/api/donors/:id` | Get donor by ID |
| PUT | `/api/donors/:id` | Update donor |
| DELETE | `/api/donors/:id` | Delete donor |
| GET | `/api/donors/:id/status` | Get donor status with recent donations |
| PUT | `/api/donors/:id/status` | Update donor status |
| POST | `/api/donors/trigger-status-update` | Manually trigger status updates |

### 💰 Donations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/donations` | Get all donations (with filters) |
| POST | `/api/donations` | Create new donation |
| POST | `/api/donations/skip` | Skip donation for a donor |

### 🏘️ Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groups` | Get all groups |
| POST | `/api/groups` | Create new group |
| GET | `/api/groups/:id` | Get group with its donors |
| PUT | `/api/groups/:id` | Update group |
| DELETE | `/api/groups/:id` | Delete group |

## 🔍 Detailed Usage Examples

### Authentication Flow

#### 1. Register User
```javascript
const registerUser = async (userData) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Krishna Das',
      email: 'krishna.das@example.com',
      password: 'Password123'
    })
  });
  
  const data = await response.json();
  if (data.success) {
    // Store token
    localStorage.setItem('token', data.data.token);
  }
  return data;
};
```

#### 2. Login User
```javascript
const loginUser = async (credentials) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'krishna.das@example.com',
      password: 'Password123'
    })
  });
  
  const data = await response.json();
  if (data.success) {
    // Store token
    localStorage.setItem('token', data.data.token);
  }
  return data;
};
```

### Donor Management

#### 1. Get All Donors with Filters
```javascript
const getDonors = async (filters = {}) => {
  const queryParams = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 10,
    ...(filters.search && { search: filters.search }),
    ...(filters.group && { group: filters.group }),
    ...(filters.status && { status: filters.status }),
    ...(filters.startDate && { startDate: filters.startDate }),
    ...(filters.endDate && { endDate: filters.endDate }),
    ...(filters.isActive !== undefined && { isActive: filters.isActive })
  });

  const response = await fetch(`/api/donors?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  return await response.json();
};

// Usage examples:
const allDonors = await getDonors();
const pendingDonors = await getDonors({ status: 'pending' });
const searchResults = await getDonors({ search: 'Krishna' });
const groupDonors = await getDonors({ group: '507f1f77bcf86cd799439012' });
```

#### 2. Create New Donor
```javascript
const createDonor = async (donorData) => {
  const response = await fetch('/api/donors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      hundiNo: 'H123456',
      name: 'Krishna Das',
      mobileNumber: '9876543210',
      address: '123 Bhakti Marg, Mayapur, West Bengal 741313',
      googleMapLink: 'https://goo.gl/maps/example',
      group: '507f1f77bcf86cd799439012'
    })
  });
  
  return await response.json();
};
```

#### 3. Update Donor Status
```javascript
const updateDonorStatus = async (donorId, status, notes = '') => {
  const response = await fetch(`/api/donors/${donorId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      status: status, // 'pending', 'collected', or 'skipped'
      notes: notes
    })
  });
  
  return await response.json();
};
```

### Donation Management

#### 1. Create Donation
```javascript
const createDonation = async (donationData) => {
  const response = await fetch('/api/donations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      donorId: '507f1f77bcf86cd799439011',
      amount: 1000,
      collectionDate: '2024-01-15T10:30:00Z',
      collectionTime: '10:30',
      notes: 'Monthly donation collected'
    })
  });
  
  return await response.json();
};
```

#### 2. Skip Donation
```javascript
const skipDonation = async (donorId, notes) => {
  const response = await fetch('/api/donations/skip', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      donorId: donorId,
      notes: notes
    })
  });
  
  return await response.json();
};
```

### Group Management

#### 1. Get All Groups
```javascript
const getGroups = async (filters = {}) => {
  const queryParams = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 10,
    ...(filters.search && { search: filters.search }),
    ...(filters.isActive !== undefined && { isActive: filters.isActive })
  });

  const response = await fetch(`/api/groups?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  return await response.json();
};
```

#### 2. Create Group
```javascript
const createGroup = async (groupData) => {
  const response = await fetch('/api/groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      name: 'Mayapur Zone',
      area: 'ISKCON Mayapur Campus',
      description: 'Devotees residing in Mayapur area including temple premises'
    })
  });
  
  return await response.json();
};
```

## 📊 Data Models

### Donor Object
```javascript
{
  _id: "507f1f77bcf86cd799439011",
  hundiNo: "H123456",
  name: "Krishna Das",
  mobileNumber: "9876543210",
  address: "123 Bhakti Marg, Mayapur, West Bengal 741313",
  googleMapLink: "https://goo.gl/maps/example",
  group: {
    _id: "507f1f77bcf86cd799439012",
    name: "Mayapur Zone",
    area: "ISKCON Mayapur Campus"
  },
  status: "pending", // "pending", "collected", "skipped"
  collectionDate: "2024-02-15T00:00:00Z",
  statusHistory: [
    {
      status: "pending",
      date: "2024-01-15T10:30:00Z",
      notes: "Donor created"
    }
  ],
  isActive: true,
  createdBy: {
    _id: "507f1f77bcf86cd799439013",
    name: "Admin User",
    email: "admin@example.com"
  },
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

### Donation Object
```javascript
{
  _id: "507f1f77bcf86cd799439014",
  donor: {
    _id: "507f1f77bcf86cd799439011",
    name: "Krishna Das",
    hundiNo: "H123456",
    status: "collected"
  },
  amount: 1000,
  collectionDate: "2024-01-15T10:30:00Z",
  collectionTime: "10:30",
  notes: "Monthly donation collected",
  collectedBy: {
    _id: "507f1f77bcf86cd799439013",
    name: "Admin User",
    email: "admin@example.com"
  },
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

### Group Object
```javascript
{
  _id: "507f1f77bcf86cd799439012",
  name: "Mayapur Zone",
  area: "ISKCON Mayapur Campus",
  description: "Devotees residing in Mayapur area including temple premises",
  isActive: true,
  createdBy: {
    _id: "507f1f77bcf86cd799439013",
    name: "Admin User",
    email: "admin@example.com"
  },
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

## 🔄 System Logic

### Donor Status Management
- **pending**: Donor needs collection
- **collected**: Donation has been collected
- **skipped**: Collection was skipped for this month

### Automatic Status Updates
- The system runs a daily cron job at midnight
- Donors whose collection date has passed AND don't have a donation for the current month are automatically set to "pending"
- You can manually trigger this process using `/api/donors/trigger-status-update`

### Collection Date Logic
- When a donation is recorded, the next collection date is automatically set to one month later
- When a donation is skipped, the next collection date is set to one month from the skip date

## 🛠️ Error Handling

### Common Error Responses
```javascript
// Validation Error
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "mobileNumber",
      "message": "Please enter a valid 10-digit mobile number"
    }
  ]
}

// Not Found Error
{
  "success": false,
  "message": "Donor not found"
}

// Authentication Error
{
  "success": false,
  "message": "Authentication token is required"
}
```

### Error Handling Example
```javascript
const handleApiCall = async (apiFunction) => {
  try {
    const response = await apiFunction();
    
    if (!response.success) {
      // Handle specific error cases
      if (response.message.includes('Validation error')) {
        // Handle validation errors
        response.errors.forEach(error => {
          console.error(`${error.field}: ${error.message}`);
        });
      } else if (response.message.includes('Not authorized')) {
        // Redirect to login
        window.location.href = '/login';
      } else {
        // Handle other errors
        alert(response.message);
      }
    }
    
    return response;
  } catch (error) {
    console.error('Network error:', error);
    alert('Network error occurred. Please try again.');
  }
};
```

## 📱 Frontend Integration Tips

### 1. Token Management
```javascript
// Store token on login
localStorage.setItem('token', token);

// Check if token exists
const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Remove token on logout
const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};
```

### 2. API Client Setup
```javascript
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Convenience methods
  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
}

// Usage
const api = new ApiClient('http://localhost:3000');
const donors = await api.get('/api/donors');
```

### 3. Real-time Updates
Consider implementing WebSocket connections or polling for real-time updates of donor statuses, especially for the automatic status updates.

## 🔗 Additional Resources

- **Swagger Documentation**: Visit `/api-docs` on your server for interactive API documentation
- **Health Check**: Use `/api/health` to check if the server is running
- **Ping**: Use `/ping` for lightweight health checks

## 🚨 Important Notes

1. **All users have full access**: This is an NGO system where all authenticated users can view, create, update, and delete all data
2. **No role-based restrictions**: There are no admin/user role distinctions
3. **Automatic status updates**: The system automatically manages donor statuses based on collection dates
4. **Data consistency**: Always handle API errors gracefully and provide user feedback
5. **Token expiration**: Implement token refresh logic or redirect to login when tokens expire

---

For more detailed information, visit the Swagger documentation at `/api-docs` when the server is running. 