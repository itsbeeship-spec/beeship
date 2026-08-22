/**
 * Express middleware to check if the authenticated user has the SUPER_ADMIN role.
 * Used for staff management routes (create/delete ADMIN and SUPPORT accounts).
 * Assumes req.user has been populated by the auth middleware first.
 */
export const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: {
      message: 'Access denied. Super Administrator privileges required.',
      statusCode: 403,
    },
  });
};
