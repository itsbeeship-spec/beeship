import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const parseCookies = (cookieHeader) => {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    list[name] = val;
  });
  return list;
};

/**
 * Express middleware to enforce JWT-based authorization.
 * Extracts bearer token from cookie or header, checks database presence, and injects user context.
 */
export const auth = async (req, res, next) => {
  let token = null;

  // Try extracting from cookies first
  if (req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.beeship_token) {
      token = cookies.beeship_token;
    }
  }

  // Fallback to Authorization Header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Access denied. No authentication token provided.',
        statusCode: 401,
      },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-beeship-1234567890-secure');
    
    // Validate if the user actually exists in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        email: true, 
        mobile: true,
        firstName: true, 
        lastName: true, 
        companyName: true,
        role: true, 
        status: true,
        kycStatus: true,
        kycRejectReason: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        pincode: true,
        gstNumber: true,
        gstUrl: true,
        businessType: true,
        panNumber: true,
        panName: true,
        panUrl: true,
        aadhaarNumber: true,
        aadhaarName: true,
        aadhaarFrontUrl: true,
        aadhaarBackUrl: true,
        bankHolderName: true,
        bankAccountNumber: true,
        bankName: true,
        bankBranch: true,
        bankAccountType: true,
        bankIfsc: true,
        bankChequeUrl: true
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User account not found or session invalid.',
          statusCode: 401,
        },
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Account Suspended! Your seller account has been suspended by Administrator.',
          statusCode: 403,
          code: 'ACCOUNT_SUSPENDED',
        },
      });
    }

    // Bind user meta context to request object
    req.user = user;
    next();
  } catch (error) {
    let message = 'Invalid or corrupted authorization token.';
    let code = 'INVALID_TOKEN';

    if (error.name === 'TokenExpiredError') {
      message = 'Session expired. Please log in again.';
      code = 'TOKEN_EXPIRED';
    }

    return res.status(401).json({
      success: false,
      error: {
        message,
        statusCode: 401,
        code,
      },
    });
  }
};
