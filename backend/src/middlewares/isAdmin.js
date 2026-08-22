/**
 * Express middleware to check if the authenticated user has the ADMIN or SUPER_ADMIN role.
 * Assumes req.user has been populated by the auth middleware first.
 */
export const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role.toUpperCase().includes('ADMIN') || req.user.role === 'SUPPORT')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: {
      message: 'Access denied. Administrator privileges required.',
      statusCode: 403,
    },
  });
};
