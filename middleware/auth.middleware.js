const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token has expired
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (currentTimestamp > decoded.exp) {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      // Find user and ensure they exist and are active
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

      // Check if token is about to expire (within 1 hour)
      const oneHourFromNow = currentTimestamp + (60 * 60);
      if (decoded.exp < oneHourFromNow) {
        // Generate new token
        const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN || '30d'
        });
        
        // Add new token to response headers
        res.setHeader('X-New-Token', newToken);
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin middleware with proper error handling
const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { auth, isAdmin };