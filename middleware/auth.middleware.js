const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const {
  createErrorResponse,
  ERROR_MESSAGES,
  ERROR_CODES,
} = require("../utils/errorHandler");

const TOKEN_REFRESH_THRESHOLD = 24 * 60 * 60; // 24 hours in seconds

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json(
          createErrorResponse(
            401,
            ERROR_MESSAGES.UNAUTHORIZED,
            null,
            ERROR_CODES.UNAUTHORIZED
          )
        );
    }

    const token = authHeader.replace("Bearer ", "");

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user exists and is active
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res
          .status(401)
          .json(
            createErrorResponse(
              401,
              ERROR_MESSAGES.USER_NOT_FOUND,
              null,
              ERROR_CODES.UNAUTHORIZED
            )
          );
      }

      if (!user.isActive) {
        return res
          .status(401)
          .json(
            createErrorResponse(
              401,
              ERROR_MESSAGES.USER_DEACTIVATED,
              null,
              ERROR_CODES.UNAUTHORIZED
            )
          );
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Check if token needs to be refreshed
      const tokenExp = decoded.exp;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExp = tokenExp - now;

      if (timeUntilExp < TOKEN_REFRESH_THRESHOLD) {
        try {
          // Generate new token
          const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || "30d",
          });

          // Add new token to response headers
          res.setHeader("X-New-Token", newToken);
          res.setHeader(
            "X-Token-Expiry",
            new Date(decoded.exp * 1000).toISOString()
          );
          res.setHeader(
            "Access-Control-Expose-Headers",
            "X-New-Token, X-Token-Expiry"
          );
        } catch (error) {
          console.error("Token refresh error:", error);
          // Continue with the request even if token refresh fails
        }
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json(
            createErrorResponse(
              401,
              ERROR_MESSAGES.TOKEN_EXPIRED,
              null,
              ERROR_CODES.TOKEN_EXPIRED
            )
          );
      }

      if (error.name === "JsonWebTokenError") {
        return res
          .status(401)
          .json(
            createErrorResponse(
              401,
              ERROR_MESSAGES.INVALID_TOKEN,
              null,
              ERROR_CODES.INVALID_TOKEN
            )
          );
      }

      throw error;
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res
      .status(500)
      .json(
        createErrorResponse(
          500,
          ERROR_MESSAGES.AUTH_FAILED,
          process.env.NODE_ENV === "development" ? error.message : undefined
        )
      );
  }
};

// Simple middleware that just ensures user is authenticated (no role checks)
const ensureAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json(
          createErrorResponse(
            401,
            ERROR_MESSAGES.UNAUTHORIZED,
            null,
            ERROR_CODES.UNAUTHORIZED
          )
        );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if token has expired
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (currentTimestamp > decoded.exp) {
        return res
          .status(401)
          .json(
            createErrorResponse(
              401,
              ERROR_MESSAGES.TOKEN_EXPIRED,
              null,
              ERROR_CODES.TOKEN_EXPIRED
            )
          );
      }

      // Find user and ensure they exist and are active
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res
          .status(401)
          .json(
            createErrorResponse(
              401,
              ERROR_MESSAGES.USER_NOT_FOUND,
              null,
              ERROR_CODES.UNAUTHORIZED
            )
          );
      }

      if (!user.isActive) {
        return res
          .status(401)
          .json(
            createErrorResponse(
              401,
              ERROR_MESSAGES.USER_DEACTIVATED,
              null,
              ERROR_CODES.UNAUTHORIZED
            )
          );
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json(
            createErrorResponse(
              401,
              ERROR_MESSAGES.TOKEN_EXPIRED,
              null,
              ERROR_CODES.TOKEN_EXPIRED
            )
          );
      }

      if (error.name === "JsonWebTokenError") {
        return res
          .status(401)
          .json(
            createErrorResponse(
              401,
              ERROR_MESSAGES.INVALID_TOKEN,
              null,
              ERROR_CODES.INVALID_TOKEN
            )
          );
      }

      throw error;
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res
      .status(500)
      .json(
        createErrorResponse(500, ERROR_MESSAGES.AUTH_FAILED, error.message)
      );
  }
};

module.exports = { auth };
