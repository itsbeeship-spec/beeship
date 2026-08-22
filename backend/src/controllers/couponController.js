import prisma from '../config/db.js';

export const ensureWelcomeCoupon = async () => {
  try {
    const existing = await prisma.coupon.findUnique({ where: { code: 'WELCOME100' } });
    if (!existing) {
      await prisma.coupon.create({
        data: {
          code: 'WELCOME100',
          title: 'First Recharge Welcome Offer',
          description: 'Automatic bonus on 1st wallet recharge for new sellers',
          discountType: 'FLAT',
          discountValue: 100,
          minRecharge: 0,
          isFeatured: false,
          active: true,
          targetSellerId: null,
        },
      });
    }
  } catch (e) {
    // Ignore seeding error
  }
};

/**
 * GET /api/coupons/featured
 * Returns the currently active featured promo coupon (if any)
 * AND whether the user is eligible for the first-time Welcome Offer.
 */
export const getFeaturedCoupon = async (req, res, next) => {
  const userId = req.user?.id;

  try {
    await ensureWelcomeCoupon();

    // Check if user has performed any previous successful recharges
    let isFirstTimeUser = true;
    if (userId) {
      const rechargeCount = await prisma.walletTransaction.count({
        where: {
          userId,
          type: 'recharge',
          status: 'Success',
        },
      });
      isFirstTimeUser = rechargeCount === 0;
    }

    const welcomeCoupon = await prisma.coupon.findUnique({ where: { code: 'WELCOME100' } });
    const welcomeOfferBonus = (isFirstTimeUser && welcomeCoupon && welcomeCoupon.active) ? welcomeCoupon.discountValue : 0;

    // Find active featured custom promo coupon
    // Must be either targeted to ALL sellers (targetSellerId: null) or specifically to this userId
    const featuredCoupon = await prisma.coupon.findFirst({
      where: {
        isFeatured: true,
        active: true,
        OR: [
          { targetSellerId: null },
          { targetSellerId: '' },
          ...(userId ? [{ targetSellerId: userId }] : []),
        ],
        AND: [
          {
            OR: [
              { expiryDate: null },
              { expiryDate: { gte: new Date() } },
            ],
          },
        ],
      },
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        discountType: true,
        discountValue: true,
        minRecharge: true,
        maxDiscount: true,
        targetSellerId: true,
      },
    });

    res.json({
      success: true,
      data: {
        isFirstTimeUser: isFirstTimeUser && welcomeOfferBonus > 0,
        welcomeOfferBonus,
        featuredCoupon: featuredCoupon || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/coupons/validate
 * Validates a coupon code for a given recharge amount
 */
export const validateCoupon = async (req, res, next) => {
  const { code, amount } = req.body;
  const userId = req.user?.id;
  const rechargeAmount = parseFloat(amount) || 0;

  if (!code) {
    return res.status(400).json({ success: false, message: 'Coupon code is required.' });
  }

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.active) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code.' });
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'This coupon usage limit has been reached.' });
    }

    // Check seller targeting restriction
    if (coupon.targetSellerId && coupon.targetSellerId !== '' && coupon.targetSellerId !== 'ALL' && coupon.targetSellerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'This coupon code is exclusive to another seller and cannot be applied to your account.',
      });
    }

    if (rechargeAmount < coupon.minRecharge) {
      return res.status(400).json({
        success: false,
        message: `Minimum recharge amount for coupon ${coupon.code} is ₹${coupon.minRecharge}.`,
      });
    }

    let bonusAmount = 0;
    if (coupon.discountType === 'FLAT') {
      bonusAmount = coupon.discountValue;
    } else if (coupon.discountType === 'PERCENT') {
      bonusAmount = (rechargeAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && bonusAmount > coupon.maxDiscount) {
        bonusAmount = coupon.maxDiscount;
      }
    }

    res.json({
      success: true,
      data: {
        code: coupon.code,
        bonusAmount,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minRecharge: coupon.minRecharge,
        message: `Coupon ${coupon.code} applied! ₹${bonusAmount.toFixed(2)} extra bonus will be added.`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN Endpoints for Coupon Management
 */
export const getAdminCoupons = async (req, res, next) => {
  try {
    await ensureWelcomeCoupon();

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const sellerIds = coupons.map(c => c.targetSellerId).filter(Boolean);
    let sellersMap = {};
    if (sellerIds.length > 0) {
      const sellers = await prisma.user.findMany({
        where: { id: { in: sellerIds } },
        select: { id: true, firstName: true, lastName: true, companyName: true, email: true, mobile: true },
      });
      sellersMap = sellers.reduce((acc, s) => {
        acc[s.id] = s;
        return acc;
      }, {});
    }

    const result = coupons.map(c => ({
      ...c,
      targetSeller: c.targetSellerId ? sellersMap[c.targetSellerId] || null : null,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  const { code, title, description, discountType, discountValue, minRecharge, maxDiscount, isFeatured, active, usageLimit, expiryDate, targetSellerId } = req.body;

  if (!code || !discountValue) {
    return res.status(400).json({ success: false, message: 'Code and Discount Value are required.' });
  }

  try {
    const cleanCode = code.trim().toUpperCase();
    const cleanTargetSellerId = targetSellerId && targetSellerId !== 'ALL' ? targetSellerId : null;

    // If making this coupon featured, unfeature others
    if (isFeatured) {
      await prisma.coupon.updateMany({
        where: { isFeatured: true, targetSellerId: cleanTargetSellerId },
        data: { isFeatured: false },
      });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        title: title || cleanCode,
        description: description || '',
        discountType: discountType || 'FLAT',
        discountValue: parseFloat(discountValue),
        minRecharge: parseFloat(minRecharge) || 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        isFeatured: Boolean(isFeatured),
        active: active !== undefined ? Boolean(active) : true,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        targetSellerId: cleanTargetSellerId,
      },
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  const { id } = req.params;
  const { title, description, discountType, discountValue, minRecharge, maxDiscount, isFeatured, active, usageLimit, expiryDate, targetSellerId } = req.body;

  try {
    const cleanTargetSellerId = targetSellerId !== undefined ? (targetSellerId && targetSellerId !== 'ALL' ? targetSellerId : null) : undefined;

    if (isFeatured) {
      await prisma.coupon.updateMany({
        where: { isFeatured: true, NOT: { id } },
        data: { isFeatured: false },
      });
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(discountType !== undefined && { discountType }),
        ...(discountValue !== undefined && { discountValue: parseFloat(discountValue) }),
        ...(minRecharge !== undefined && { minRecharge: parseFloat(minRecharge) }),
        ...(maxDiscount !== undefined && { maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
        ...(active !== undefined && { active: Boolean(active) }),
        ...(usageLimit !== undefined && { usageLimit: usageLimit ? parseInt(usageLimit, 10) : null }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(cleanTargetSellerId !== undefined && { targetSellerId: cleanTargetSellerId }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  const { id } = req.params;
  try {
    await prisma.coupon.delete({ where: { id } });
    res.json({ success: true, message: 'Coupon deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

