const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Add token expiry check
      if (decoded.exp < Date.now() / 1000) {
        return res.status(401).json({
          success: false,
          message: 'Token has expired'
        });
      }

      // Find user
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token'
      });
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is invalid or expired'
    });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

module.exports = { auth, isAdmin };