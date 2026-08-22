import prisma from '../config/db.js';
import { z } from 'zod';

export const kycSubmitSchema = z.object({
  body: z.object({
    // Basic Info
    companyName: z.string().min(2, 'Company name is required').trim(),
    email: z.string().email('Invalid email address').trim(),
    mobile: z.string().min(10, 'Invalid contact number').trim(),
    gstNumber: z.string().optional().nullable(),
    addressLine1: z.string().min(5, 'Address line 1 is required').trim(),
    addressLine2: z.string().optional().nullable(),
    city: z.string().min(2, 'City is required').trim(),
    state: z.string().min(2, 'State is required').trim(),
    pincode: z.string().min(6, 'Invalid pincode').trim(),
    gstUrl: z.string().optional().nullable(),

    // KYC Details
    businessType: z.string().min(2, 'Business type is required').trim(),
    panNumber: z.string().min(10, 'Invalid PAN card number').trim(),
    panName: z.string().min(2, 'Name on PAN is required').trim(),
    panUrl: z.string().optional().nullable(),
    aadhaarNumber: z.string().min(12, 'Invalid Aadhaar number').trim(),
    aadhaarName: z.string().min(2, 'Name on document is required').trim(),
    aadhaarFrontUrl: z.string().optional().nullable(),
    aadhaarBackUrl: z.string().optional().nullable(),

    // Bank Details
    bankHolderName: z.string().min(2, 'Account holder name is required').trim(),
    bankAccountNumber: z.string().min(5, 'Invalid bank account number').trim(),
    bankName: z.string().min(2, 'Bank name is required').trim(),
    bankBranch: z.string().optional().nullable(),
    bankAccountType: z.string().min(2, 'Account type is required').trim(),
    bankIfsc: z.string().min(11, 'Invalid IFSC code').trim(),
    bankChequeUrl: z.string().optional().nullable(),
  }),
});

/**
 * Handle user's multi-step KYC documents submission
 */
export const submitKyc = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const details = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        companyName: details.companyName,
        email: details.email,
        mobile: details.mobile,
        gstNumber: details.gstNumber,
        addressLine1: details.addressLine1,
        addressLine2: details.addressLine2,
        city: details.city,
        state: details.state,
        pincode: details.pincode,
        gstUrl: details.gstUrl,

        businessType: details.businessType,
        panNumber: details.panNumber,
        panName: details.panName,
        panUrl: details.panUrl,
        aadhaarNumber: details.aadhaarNumber,
        aadhaarName: details.aadhaarName,
        aadhaarFrontUrl: details.aadhaarFrontUrl,
        aadhaarBackUrl: details.aadhaarBackUrl,

        bankHolderName: details.bankHolderName,
        bankAccountNumber: details.bankAccountNumber,
        bankName: details.bankName,
        bankBranch: details.bankBranch,
        bankAccountType: details.bankAccountType,
        bankIfsc: details.bankIfsc,
        bankChequeUrl: details.bankChequeUrl,

        kycStatus: 'PENDING',
        kycRejectReason: null, // Clear past rejection comments
      },
      select: {
        id: true,
        email: true,
        kycStatus: true,
        kycRejectReason: true,
      },
    });

    res.json({
      success: true,
      message: 'KYC documents submitted successfully. Status is now PENDING verification.',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
