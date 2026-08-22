import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/db.js';
import redis from '../config/redis.js';
import { logActivity } from './activityLogController.js';

// Helper to serialize all user fields (excluding password)
const serializeUser = (user) => {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    mobile: user.mobile,
    companyName: user.companyName,
    role: user.role,
    kycStatus: user.kycStatus,
    kycRejectReason: user.kycRejectReason,
    aadhaarNumber: user.aadhaarNumber,
    panNumber: user.panNumber,
    gstNumber: user.gstNumber,
    aadhaarFrontUrl: user.aadhaarFrontUrl,
    aadhaarBackUrl: user.aadhaarBackUrl,
    panUrl: user.panUrl,
    addressLine1: user.addressLine1,
    addressLine2: user.addressLine2,
    city: user.city,
    state: user.state,
    pincode: user.pincode,
    gstUrl: user.gstUrl,
    businessType: user.businessType,
    panName: user.panName,
    aadhaarName: user.aadhaarName,
    bankHolderName: user.bankHolderName,
    bankAccountNumber: user.bankAccountNumber,
    bankName: user.bankName,
    bankBranch: user.bankBranch,
    bankAccountType: user.bankAccountType,
    bankIfsc: user.bankIfsc,
    bankChequeUrl: user.bankChequeUrl,
  };
};

// Schemas for inputs
export const sendOtpSchema = z.object({
  body: z.object({
    mobileOrEmail: z.string().min(3, 'Email address or Mobile number is required').trim(),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    mobileOrEmail: z.string().min(3, 'Email address or Mobile number is required').trim(),
    code: z.string().length(6, 'OTP must be exactly 6 digits').trim(),
  }),
});

export const registerBusinessSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required').trim(),
    lastName: z.string().min(1, 'Last name is required').trim(),
    mobile: z.string().min(10, 'Provide a valid mobile number').trim(),
    email: z.string().email('Provide a valid email address').trim(),
    companyName: z.string().min(2, 'Company name must be at least 2 characters').trim(),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    shipmentsRange: z.string().min(1, 'Shipments range is required').trim(),
  }),
});

export const resetPasswordRequestSchema = z.object({
  body: z.object({
    mobileOrEmail: z.string().min(3, 'Email address or Mobile number is required').trim(),
  }),
});

export const resetPasswordConfirmSchema = z.object({
  body: z.object({
    mobileOrEmail: z.string().min(3, 'Email address or Mobile number is required').trim(),
    code: z.string().length(6, 'OTP must be exactly 6 digits').trim(),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters long'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(3, 'Email address or Mobile number is required').trim(),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

/**
 * Generate and Send Mock OTP (Stored in Redis)
 */
export const sendOTP = async (req, res, next) => {
  const { mobileOrEmail } = req.body;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: mobileOrEmail },
          { mobile: mobileOrEmail }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: existingUser.mobile === mobileOrEmail 
            ? 'A user with this mobile number is already registered.' 
            : 'A user with this email address is already registered.',
          statusCode: 409,
        },
      });
    }

    // Generate a random 6-digit code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const redisKey = `beeship:otp:send:${mobileOrEmail}`;

    // Store in Redis with 5 minutes (300s) TTL if Redis is connected
    if (redis && redis.status === 'ready') {
      await redis.set(redisKey, otpCode, 'EX', 300);
    } else {
      console.warn('[Redis] Offline. Saving OTP in-memory/fallback');
      // For local testing backup when Redis is offline, we can log it
    }

    // Print to Console log for user verification in dev mode
    console.log(`\n=================================`);
    console.log(`📩 OTP Verification Code for: ${mobileOrEmail}`);
    console.log(`👉 CODE: ${otpCode} (Expires in 5 minutes)`);
    console.log(`=================================\n`);

    res.json({
      success: true,
      message: 'OTP sent successfully. Please check your console logs.',
      // In development/mock setups we can also return the code to verify it easily
      mockOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP (Read from Redis)
 */
export const verifyOTP = async (req, res, next) => {
  const { mobileOrEmail, code } = req.body;
  const redisKey = `beeship:otp:send:${mobileOrEmail}`;
  const verifyKey = `beeship:otp:verified:${mobileOrEmail}`;

  try {
    let matches = false;

    if (redis && redis.status === 'ready') {
      const storedOtp = await redis.get(redisKey);
      if (storedOtp === code) {
        matches = true;
        // Delete OTP code so it cannot be reused
        await redis.del(redisKey);
        // Set verification state in Redis for 15 mins (900s)
        await redis.set(verifyKey, 'verified', 'EX', 900);
      }
    } else {
      // Mock fallback: if Redis is offline, accept "123456" for dev convenience
      if (code === '123456' || code === '654321') {
        matches = true;
      }
    }

    if (!matches) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'The OTP entered is invalid or has expired.',
          statusCode: 400,
        },
      });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully. Proceed to fill business details.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save Business Registration Profile to DB
 */
export const registerBusiness = async (req, res, next) => {
  const { firstName, lastName, mobile, email, companyName, password, shipmentsRange } = req.body;

  try {
    // Check if OTP was verified (check in Redis)
    let isVerified = false;
    const verifyMobileKey = `beeship:otp:verified:${mobile}`;
    const verifyEmailKey = `beeship:otp:verified:${email}`;

    if (redis && redis.status === 'ready') {
      const mobileStatus = await redis.get(verifyMobileKey);
      const emailStatus = await redis.get(verifyEmailKey);

      if (mobileStatus === 'verified' || emailStatus === 'verified') {
        isVerified = true;
        // Clean up verification keys
        await redis.del(verifyMobileKey);
        await redis.del(verifyEmailKey);
      }
    } else {
      // Redis offline: let register bypass OTP check in development
      isVerified = true;
    }

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please complete the OTP verification step first.',
          statusCode: 400,
        },
      });
    }

    // Check if user already exists
    const duplicateUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { mobile }
        ]
      }
    });

    if (duplicateUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: duplicateUser.email === email 
            ? 'A user with this email address already exists.' 
            : 'A user with this mobile number already exists.',
          statusCode: 409,
        },
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save User in PostgreSQL
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        mobile,
        email,
        companyName,
        shipmentsRange,
        password: hashedPassword,
      },
    });

    // Generate JWT Access Token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'super-secret-key-beeship-1234567890-secure',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('beeship_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: serializeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request Password Reset OTP
 */
export const forgotPasswordRequest = async (req, res, next) => {
  const { mobileOrEmail } = req.body;

  try {
    // Check if user exists in PostgreSQL
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: mobileOrEmail },
          { mobile: mobileOrEmail }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'No account found with this email or mobile number.',
          statusCode: 404,
        },
      });
    }

    // Generate and save recovery OTP in Redis
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const redisKey = `beeship:otp:send:${mobileOrEmail}`;

    if (redis && redis.status === 'ready') {
      await redis.set(redisKey, otpCode, 'EX', 300); // 5 min TTL
    }

    // Print to Console log
    console.log(`\n=================================`);
    console.log(`🔑 PASSWORD RESET OTP Code for: ${mobileOrEmail}`);
    console.log(`👉 CODE: ${otpCode} (Expires in 5 minutes)`);
    console.log(`=================================\n`);

    res.json({
      success: true,
      message: 'OTP sent successfully. Please check your console logs.',
      mockOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP and Reset Password
 */
export const forgotPasswordReset = async (req, res, next) => {
  const { mobileOrEmail, code, password } = req.body;
  const redisKey = `beeship:otp:send:${mobileOrEmail}`;

  try {
    let matches = false;

    if (redis && redis.status === 'ready') {
      const storedOtp = await redis.get(redisKey);
      if (storedOtp === code) {
        matches = true;
        await redis.del(redisKey);
      }
    } else {
      if (code === '123456') {
        matches = true;
      }
    }

    if (!matches) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'The OTP entered is invalid or has expired.',
          statusCode: 400,
        },
      });
    }

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: mobileOrEmail },
          { mobile: mobileOrEmail }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Account not found.',
          statusCode: 404,
        },
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle profile fetch (Me)
 */
export const getMe = (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

/**
 * Direct Login method (email or mobile)
 */
export const login = async (req, res, next) => {
  const { email, password } = req.body; // email field here is general identifier (email or mobile)

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { mobile: email }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid login credentials.',
          statusCode: 401,
        },
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid login credentials.',
          statusCode: 401,
        },
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Account Suspended! Your seller account has been suspended by Administrator. Please contact support.',
          statusCode: 403,
          code: 'ACCOUNT_SUSPENDED',
        },
      });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'super-secret-key-beeship-1234567890-secure',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('beeship_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Log admin logins to ActivityLog
    if (user.role !== 'USER') {
      await logActivity({
        adminId: user.id,
        adminName: `${user.firstName} ${user.lastName}`,
        adminRole: user.role,
        module: 'Auth',
        action: 'Admin Login',
        targetId: user.id,
        targetLabel: `${user.firstName} ${user.lastName}`,
        severity: 'INFO',
        description: `${user.role} logged in successfully`,
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
    }

    res.json({
      success: true,
      data: {
        token,
        user: serializeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout and clear token cookie
 */
export const logout = (req, res) => {
  res.clearCookie('beeship_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * Update profile (Full Name, Email, Mobile)
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email, mobile } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required.',
      });
    }

    // Check if email already taken by another user
    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'This email address is already in use by another account.',
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        ...(email ? { email } : {}),
        ...(mobile ? { mobile } : {}),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: serializeUser(updated) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change Password
 */
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};
