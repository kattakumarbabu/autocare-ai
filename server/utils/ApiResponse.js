/**
 * Standardized API response wrapper.
 *
 * Usage:
 *   res.status(200).json(ApiResponse.success({ user }, 'Logged in'));
 *   res.status(400).json(ApiResponse.error('Validation failed', errors));
 */
class ApiResponse {
  static success(data = {}, message = 'Success') {
    return { success: true, message, data };
  }

  static error(message = 'Something went wrong', errors = null) {
    const payload = { success: false, message };
    if (errors) payload.errors = errors;
    return payload;
  }
}

module.exports = ApiResponse;
