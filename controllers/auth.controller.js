const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/user.model");
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  createErrorResponse,
  createSuccessResponse,
} = require("../utils/errorHandler");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

// Register new user
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_FAILED,
        errors: errors.array(),
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json(createErrorResponse(400, "User already exists with this email"));
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json(
      createSuccessResponse(SUCCESS_MESSAGES.REGISTER_SUCCESS, {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      })
    );
  } catch (error) {
    console.error("Registration error:", error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res
        .status(400)
        .json(createErrorResponse(400, "User already exists with this email"));
    }

    res
      .status(500)
      .json(
        createErrorResponse(500, ERROR_MESSAGES.SERVER_ERROR, error.message)
      );
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(401)
        .json(createErrorResponse(401, ERROR_MESSAGES.INVALID_CREDENTIALS));
    }

    // Check if user is active
    if (!user.isActive) {
      return res
        .status(401)
        .json(createErrorResponse(401, ERROR_MESSAGES.USER_DEACTIVATED));
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json(createErrorResponse(401, ERROR_MESSAGES.INVALID_CREDENTIALS));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json(
      createSuccessResponse(SUCCESS_MESSAGES.LOGIN_SUCCESS, {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
      })
    );
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json(
        createErrorResponse(500, ERROR_MESSAGES.SERVER_ERROR, error.message)
      );
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res
        .status(404)
        .json(createErrorResponse(404, ERROR_MESSAGES.USER_NOT_FOUND));
    }

    res.json(
      createSuccessResponse(SUCCESS_MESSAGES.PROFILE_RETRIEVED, {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      })
    );
  } catch (error) {
    console.error("Get profile error:", error);

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res
        .status(400)
        .json(createErrorResponse(400, ERROR_MESSAGES.INVALID_ID));
    }

    res
      .status(500)
      .json(
        createErrorResponse(500, ERROR_MESSAGES.SERVER_ERROR, error.message)
      );
  }
};
