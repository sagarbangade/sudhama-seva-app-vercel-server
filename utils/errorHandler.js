/**
 * Centralized error handling utilities for consistent error responses
 */

// Standard error response format
const createErrorResponse = (
  statusCode,
  message,
  error = null,
  code = null
) => {
  const response = {
    success: false,
    message: message,
  };

  if (code) {
    response.code = code;
  }

  if (error && process.env.NODE_ENV === "development") {
    response.error = error;
  }

  return response;
};

// Standard success response format
const createSuccessResponse = (message, data = null) => {
  const response = {
    success: true,
    message: message,
  };

  if (data) {
    response.data = data;
  }

  return response;
};

// Common error messages
const ERROR_MESSAGES = {
  VALIDATION_FAILED: "Validation failed",
  NOT_FOUND: "Resource not found",
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "Access denied",
  DUPLICATE_ENTRY: "Resource already exists",
  INVALID_ID: "Invalid ID format",
  SERVER_ERROR: "Something went wrong. Please try again.",
  AUTH_FAILED: "Authentication failed. Please try again.",
  TOKEN_EXPIRED: "Token has expired",
  INVALID_TOKEN: "Invalid token",
  USER_NOT_FOUND: "User not found",
  USER_DEACTIVATED: "User account is deactivated",
  INVALID_CREDENTIALS: "Invalid email or password",
  DONOR_NOT_FOUND: "Donor not found",
  GROUP_NOT_FOUND: "Group not found",
  DONATION_NOT_FOUND: "Donation not found",
  CANNOT_DELETE_WITH_DEPENDENCIES:
    "Cannot delete resource with existing dependencies",
  INVALID_STATUS_TRANSITION: "Invalid status transition",
  INACTIVE_DONOR: "Cannot perform action on inactive donor",
  NOTES_REQUIRED: "Notes are required for this action",
  DEFAULT_GROUP_NOT_FOUND:
    "Default group not found. Please create a group first.",
  NOT_IMPLEMENTED: "This functionality is not implemented yet",
};

// Common success messages
const SUCCESS_MESSAGES = {
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",
  RETRIEVED: "Resource retrieved successfully",
  LOGIN_SUCCESS: "Login successful",
  REGISTER_SUCCESS: "Registration successful",
  PROFILE_RETRIEVED: "Profile retrieved successfully",
  STATUS_UPDATED: "Status updated successfully",
  COLLECTION_SKIPPED: "Collection skipped successfully",
  DONATION_CREATED: "Donation created successfully",
  DONORS_RETRIEVED: "Donors retrieved successfully",
  DONOR_RETRIEVED: "Donor retrieved successfully",
  DONOR_STATUS_RETRIEVED: "Donor status retrieved successfully",
  DONATIONS_RETRIEVED: "Donations retrieved successfully",
  GROUPS_RETRIEVED: "Groups retrieved successfully",
  GROUP_RETRIEVED: "Group retrieved successfully",
  GROUP_AND_DONORS_RETRIEVED: "Group and donors retrieved successfully",
  STATUS_UPDATE_COMPLETED: "Status update completed successfully",
};

// HTTP status codes
const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
};

// Error codes for client-side handling
const ERROR_CODES = {
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  SERVER_ERROR: "SERVER_ERROR",
};

module.exports = {
  createErrorResponse,
  createSuccessResponse,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STATUS_CODES,
  ERROR_CODES,
};
