import prisma from '../config/db.js';
import { estimateCourierRates } from '../utils/rateCalculatorEngine.js';

// Resolve zones based on pincodes
function resolveZone(src, dest) {
  src = String(src).trim();
  dest = String(dest).trim();

  if (src === dest) {
    return "withinCity";
  }

  const metroPrefixes = ["110", "400", "560", "700", "600", "500"];
  const srcIsMetro = metroPrefixes.some(p => src.startsWith(p));
  const destIsMetro = metroPrefixes.some(p => dest.startsWith(p));

  if (srcIsMetro && destIsMetro) {
    return "metroToMetro";
  }

  // North East & JK checks
  if (dest.startsWith("78") || dest.startsWith("79") || dest.startsWith("18") || dest.startsWith("19")) {
    return "northEastAndJk";
  }

  if (src.slice(0, 2) === dest.slice(0, 2)) {
    return "withinState";
  }

  return "restOfIndia";
}

// 1. Get all billing rates for logged in merchant (combines GLOBAL + merchant overrides)
export const getBillingRates = async (req, res, next) => {
  const userId = req.user.id;
  try {
    let globalRates = await prisma.billingRate.findMany({
      where: { userId: "GLOBAL" },
    });

    // Ensure all standard active courier partners exist in globalRates DB
    if (globalRates.length < 4) {
      const ALL_4_SEEDS = [
        { courier: "Delhivery Surface (DS)", userId: "GLOBAL", withinCity: 40, withinState: 47, metroToMetro: 60, restOfIndia: 72, northEastAndJk: 88, codCharges: 35, codPercent: 2 },
        { courier: "Bluedart Surface (N)", userId: "GLOBAL", withinCity: 45, withinState: 52, metroToMetro: 65, restOfIndia: 78, northEastAndJk: 95, codCharges: 35, codPercent: 2 },
        { courier: "Xpressbees Surface", userId: "GLOBAL", withinCity: 38, withinState: 44, metroToMetro: 56, restOfIndia: 68, northEastAndJk: 82, codCharges: 35, codPercent: 2 },
        { courier: "Amazon Shipping", userId: "GLOBAL", withinCity: 35, withinState: 42, metroToMetro: 52, restOfIndia: 64, northEastAndJk: 78, codCharges: 35, codPercent: 2 },
      ];

      await Promise.all(ALL_4_SEEDS.map(seed => 
        prisma.billingRate.upsert({
          where: { courier_userId: { courier: seed.courier, userId: "GLOBAL" } },
          update: {},
          create: seed
        }).catch(() => {})
      ));

      globalRates = await prisma.billingRate.findMany({
        where: { userId: "GLOBAL" },
      });
    }

    const userRates = await prisma.billingRate.findMany({
      where: { userId },
    });

    // Check if there is a bulk "ALL" rate override entry for this user
    const allOverride = userRates.find(r => r.courier === "ALL" || r.courier === "All Couriers");

    const mergedRates = globalRates.map((gRate) => {
      const uRate = userRates.find((r) => 
        r.courier !== "ALL" && r.courier !== "All Couriers" && (
          r.courier.trim().toLowerCase() === gRate.courier.trim().toLowerCase() ||
          r.courier.toLowerCase().includes(gRate.courier.toLowerCase()) ||
          gRate.courier.toLowerCase().includes(r.courier.toLowerCase())
        )
      );

      const effectiveRate = uRate || allOverride;

      const mergedCodCharges = (effectiveRate && effectiveRate.codCharges !== undefined && effectiveRate.codCharges !== 35)
        ? effectiveRate.codCharges
        : gRate.codCharges;

      const mergedCodPercent = (effectiveRate && effectiveRate.codPercent !== undefined && effectiveRate.codPercent !== 2)
        ? effectiveRate.codPercent
        : gRate.codPercent;

      return effectiveRate 
        ? { 
            ...gRate, 
            withinCity: effectiveRate.withinCity,
            withinState: effectiveRate.withinState,
            metroToMetro: effectiveRate.metroToMetro,
            restOfIndia: effectiveRate.restOfIndia,
            northEastAndJk: effectiveRate.northEastAndJk,
            codCharges: mergedCodCharges,
            codPercent: mergedCodPercent,
            id: effectiveRate.id || gRate.id
          } 
        : gRate;
    });

    // Filter out any "ALL" courier entries from mergedRates so "ALL" never shows up as a row
    const finalRates = mergedRates.filter(r => r.courier !== "ALL" && r.courier !== "All Couriers");

    finalRates.sort((a, b) => a.courier.localeCompare(b.courier));

    res.json({ success: true, data: finalRates });
  } catch (error) {
    next(error);
  }
};

// 2. Admin: Update a billing rate (global or user override)
export const updateBillingRate = async (req, res, next) => {
  const { id } = req.params;
  const { withinCity, withinState, metroToMetro, restOfIndia, northEastAndJk, codCharges, codPercent } = req.body;

  try {
    const updated = await prisma.billingRate.update({
      where: { id },
      data: {
        withinCity: parseFloat(withinCity),
        withinState: parseFloat(withinState),
        metroToMetro: parseFloat(metroToMetro),
        restOfIndia: parseFloat(restOfIndia),
        northEastAndJk: parseFloat(northEastAndJk),
        codCharges: parseFloat(codCharges),
        codPercent: parseFloat(codPercent),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// 3. Calculator: Estimate shipping charges (supports dimensions & volumetric weight)
export const calculateB2CShippingCost = async (req, res, next) => {
  const { sourcePincode, destPincode, weight, length, width, height, type, collectableAmount } = req.body;

  if (!sourcePincode || !destPincode || !weight) {
    return res.status(400).json({ success: false, message: "Missing source, destination, or weight." });
  }

  try {
    const userId = req.user.id;

    // Fetch Calculator specific rates (Base + Additional rate rows)
    const calcBaseRates = await prisma.billingRate.findMany({
      where: { userId: "CALCULATOR" },
    });
    const calcAddRates = await prisma.billingRate.findMany({
      where: { userId: "CALCULATOR_ADD" },
    });

    let calcRates = calcBaseRates;
    if (!calcRates || calcRates.length === 0) {
      calcRates = await prisma.billingRate.findMany({
        where: { userId: "GLOBAL" },
      });
    }

    const mergedRates = calcRates.map((gRate) => {
      const addEntry = calcAddRates.find(r => r.courier === gRate.courier);

      return {
        ...gRate,
        withinCity: gRate.withinCity,
        withinState: gRate.withinState,
        metroToMetro: gRate.metroToMetro,
        restOfIndia: gRate.restOfIndia,
        northEastAndJk: gRate.northEastAndJk,
        addWithinCity: addEntry ? addEntry.withinCity : Math.round((gRate.withinCity || 40) * 0.6),
        addWithinState: addEntry ? addEntry.withinState : Math.round((gRate.withinState || 47) * 0.6),
        addMetroToMetro: addEntry ? addEntry.metroToMetro : Math.round((gRate.metroToMetro || 60) * 0.6),
        addRestOfIndia: addEntry ? addEntry.restOfIndia : Math.round((gRate.restOfIndia || 72) * 0.6),
        addNorthEastAndJk: addEntry ? addEntry.northEastAndJk : Math.round((gRate.northEastAndJk || 88) * 0.6),
        weightSlabStep: addEntry ? addEntry.codCharges : 0.5,
        codCharges: gRate.codCharges || 35,
        codPercent: gRate.codPercent || 2,
      };
    });

    const rawEstimations = estimateCourierRates({
      sourcePincode,
      destPincode,
      weight,
      length,
      width,
      height,
      orderAmount: collectableAmount || 0,
      paymentType: type,
      rateCards: mergedRates
    });

    const estimation = rawEstimations.map(e => ({
      courier: e.courier,
      zone: e.zone.replace(/([A-Z])/g, ' $1').toUpperCase(),
      freightCharge: e.freightCharge,
      codCharge: e.codFee,
      totalCharge: e.totalCost
    }));

    res.json({ success: true, data: estimation });
  } catch (error) {
    next(error);
  }
};

// 4. Wallet Transactions log
export const getWalletTransactions = async (req, res, next) => {
  const userId = req.user.id;

  try {
    let transactions = await prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    if (transactions.length === 0) {
      const defaultTx = [
        {
          txId: `TXN-90218-${userId.slice(0, 8)}`,
          date: new Date(Date.now() - 3600000 * 24),
          type: "recharge",
          awb: null,
          description: "Wallet Recharge - UPI",
          amount: 5000.00,
          status: "Success",
          userId,
        },
        {
          txId: `TXN-89912-${userId.slice(0, 8)}`,
          date: new Date(Date.now() - 3600000 * 48),
          type: "shipping",
          awb: "77846454383",
          description: "AWB-77846454383 Freight Charge",
          amount: -65.00,
          status: "Success",
          userId,
        },
        {
          txId: `TXN-89801-${userId.slice(0, 8)}`,
          date: new Date(Date.now() - 3600000 * 72),
          type: "refund",
          awb: "77846454383",
          description: "COD refund for RTO shipment",
          amount: 35.00,
          status: "Success",
          userId,
        },
        {
          txId: `TXN-89755-${userId.slice(0, 8)}`,
          date: new Date(Date.now() - 3600000 * 96),
          type: "rto",
          awb: "88937482910",
          description: "AWB-88937482910 RTO Charges",
          amount: -55.00,
          status: "Success",
          userId,
        }
      ];

      for (const tx of defaultTx) {
        await prisma.walletTransaction.create({ data: tx });
      }

      transactions = await prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      });
    }

    const netTransactionsAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const balance = 8420.00 + netTransactionsAmount;

    res.json({
      success: true,
      balance,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Add a recharge transaction (with 1st-time welcome bonus & coupon support)
export const addRechargeTransaction = async (req, res, next) => {
  const userId = req.user.id;
  const { amount, couponCode } = req.body;
  const baseAmount = parseFloat(amount);

  if (!baseAmount || baseAmount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid recharge amount." });
  }

  try {
    // Check if user is performing their first ever successful wallet recharge
    const rechargeCount = await prisma.walletTransaction.count({
      where: {
        userId,
        type: "recharge",
        status: "Success",
      },
    });
    const isFirstRecharge = rechargeCount === 0;

    const txId = "TXN-" + Math.floor(100000 + Math.random() * 900000);
    const newTx = await prisma.walletTransaction.create({
      data: {
        txId,
        type: "recharge",
        description: "Wallet Recharge - UPI",
        amount: baseAmount,
        couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
        status: "Success",
        userId,
      },
    });

    // 1. Grant 1st-time user ₹100 Welcome Bonus automatically
    if (isFirstRecharge) {
      const bonusTxId = "TXN-BONUS-" + Math.floor(100000 + Math.random() * 900000);
      await prisma.walletTransaction.create({
        data: {
          txId: bonusTxId,
          type: "recharge",
          description: "🎁 Welcome Bonus - 1st Wallet Recharge Reward",
          amount: 100.0,
          status: "Success",
          userId,
        },
      });
    }

    // 2. Handle Custom Promo Coupon if applied
    if (couponCode && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = await prisma.coupon.findUnique({
        where: { code: cleanCode },
      });

      if (coupon && coupon.active && baseAmount >= coupon.minRecharge) {
        let couponBonus = 0;
        if (coupon.discountType === "FLAT") {
          couponBonus = coupon.discountValue;
        } else if (coupon.discountType === "PERCENT") {
          couponBonus = (baseAmount * coupon.discountValue) / 100;
          if (coupon.maxDiscount && couponBonus > coupon.maxDiscount) {
            couponBonus = coupon.maxDiscount;
          }
        }

        if (couponBonus > 0) {
          const promoTxId = "TXN-PROMO-" + Math.floor(100000 + Math.random() * 900000);
          await prisma.walletTransaction.create({
            data: {
              txId: promoTxId,
              type: "recharge",
              description: `⚡ Promo Bonus - Coupon ${cleanCode}`,
              amount: couponBonus,
              couponCode: cleanCode,
              status: "Success",
              userId,
            },
          });

          // Increment usage count
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          }).catch(() => {});
        } 
      }
    }

    const aggregateResult = await prisma.walletTransaction.aggregate({
      where: { userId, status: "Success" },
      _sum: { amount: true }
    });
    const balance = 8420.00 + (aggregateResult._sum.amount || 0);

    res.json({
      success: true,
      balance,
      data: newTx,
      isFirstRecharge,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Admin: Get all merchants list (users with role USER)
export const getAdminMerchants = async (req, res, next) => {
  try {
    const merchants = await prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        email: true,
        companyName: true,
        firstName: true,
        lastName: true,
      },
      orderBy: { companyName: 'asc' },
    });
    res.json({ success: true, data: merchants });
  } catch (error) {
    next(error);
  }
};

// 7. Admin: Get rate mapping for a specific user (combines GLOBAL + merchant overrides)
export const getMerchantBillingRates = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const globalRates = await prisma.billingRate.findMany({
      where: { userId: "GLOBAL" },
    });

    const userRates = await prisma.billingRate.findMany({
      where: { userId },
    });

    const addRates = userId === "CALCULATOR"
      ? await prisma.billingRate.findMany({ where: { userId: "CALCULATOR_ADD" } })
      : [];

    const mergedRates = globalRates.map((gRate) => {
      const uRate = userRates.find((r) => r.courier === gRate.courier);
      const addRate = addRates.find((r) => r.courier === gRate.courier);

      const baseObj = uRate || gRate;

      return {
        ...gRate,
        ...baseObj,
        addWithinCity: addRate ? addRate.withinCity : Math.round(baseObj.withinCity * 0.6),
        addWithinState: addRate ? addRate.withinState : Math.round(baseObj.withinState * 0.6),
        addMetroToMetro: addRate ? addRate.metroToMetro : Math.round(baseObj.metroToMetro * 0.6),
        addRestOfIndia: addRate ? addRate.restOfIndia : Math.round(baseObj.restOfIndia * 0.6),
        addNorthEastAndJk: addRate ? addRate.northEastAndJk : Math.round(baseObj.northEastAndJk * 0.6),
        weightSlabStep: addRate ? addRate.codCharges : 0.5,
        id: uRate ? uRate.id : `NEW_OVERRIDE_${gRate.courier}`,
        isOverride: !!uRate,
      };
    });

    mergedRates.sort((a, b) => a.courier.localeCompare(b.courier));

    res.json({ success: true, data: mergedRates });
  } catch (error) {
    next(error);
  }
};

// 8. Admin: Upsert rate override for a user
export const updateMerchantBillingRate = async (req, res, next) => {
  const { userId } = req.params;
  const { 
    courier, 
    withinCity, 
    withinState, 
    metroToMetro, 
    restOfIndia, 
    northEastAndJk, 
    addWithinCity,
    addWithinState,
    addMetroToMetro,
    addRestOfIndia,
    addNorthEastAndJk,
    weightSlabStep,
    codCharges, 
    codPercent 
  } = req.body;

  try {
    const wc = parseFloat(withinCity) || 0;
    const ws = parseFloat(withinState) || 0;
    const mm = parseFloat(metroToMetro) || 0;
    const roi = parseFloat(restOfIndia) || 0;
    const nejk = parseFloat(northEastAndJk) || 0;
    const cod = parseFloat(codCharges) || 35;
    const codPct = parseFloat(codPercent) || 2;
    const awc = addWithinCity !== undefined ? parseFloat(addWithinCity) : Math.round(wc * 0.6);
    const aws = addWithinState !== undefined ? parseFloat(addWithinState) : Math.round(ws * 0.6);
    const amm = addMetroToMetro !== undefined ? parseFloat(addMetroToMetro) : Math.round(mm * 0.6);
    const aroi = addRestOfIndia !== undefined ? parseFloat(addRestOfIndia) : Math.round(roi * 0.6);
    const anejk = addNorthEastAndJk !== undefined ? parseFloat(addNorthEastAndJk) : Math.round(nejk * 0.6);
    const step = weightSlabStep !== undefined ? parseFloat(weightSlabStep) : 0.5;

    const baseData = {
      withinCity: wc,
      withinState: ws,
      metroToMetro: mm,
      restOfIndia: roi,
      northEastAndJk: nejk,
      codCharges: cod,
      codPercent: codPct,
    };

    const updated = await prisma.billingRate.upsert({
      where: {
        courier_userId: {
          courier,
          userId,
        }
      },
      update: baseData,
      create: {
        courier,
        userId,
        ...baseData
      },
    });

    if (userId === "CALCULATOR") {
      // Save additional rate row in CALCULATOR_ADD
      const addData = {
        withinCity: awc,
        withinState: aws,
        metroToMetro: amm,
        restOfIndia: aroi,
        northEastAndJk: anejk,
        codCharges: step, // store slab step size
        codPercent: 0,
      };

      await prisma.billingRate.upsert({
        where: {
          courier_userId: {
            courier,
            userId: "CALCULATOR_ADD",
          }
        },
        update: addData,
        create: {
          courier,
          userId: "CALCULATOR_ADD",
          ...addData
        },
      });
    }

    const resultData = {
      ...updated,
      addWithinCity: awc,
      addWithinState: aws,
      addMetroToMetro: amm,
      addRestOfIndia: aroi,
      addNorthEastAndJk: anejk,
      weightSlabStep: step
    };

    res.json({ success: true, data: resultData });
  } catch (error) {
    next(error);
  }
};

// 7. Get Payouts / Remittance Dashboard data
export const getPayouts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Check if user has payouts. If not, seed exactly one dummy!
    let userPayouts = await prisma.payout.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    if (userPayouts.length === 0) {
      const seedPayouts = [
        {
          payoutId: "BG2-A61GGI2",
          date: new Date("2026-07-02T00:00:00.000Z"),
          codCollected: 29797.15,
          feeCharged: 0.00,
          netRemitted: 29797.15,
          status: "Paid",
          paymentRef: "IDFB6184M7451805",
          userId
        }
      ];

      await prisma.payout.createMany({
        data: seedPayouts
      });

      userPayouts = await prisma.payout.findMany({
        where: { userId },
        orderBy: { date: 'desc' }
      });
    }

    // Calculate nextRemittanceAmount as the sum of payouts with "Pending" status, or default to mockup values
    const pendingPayouts = userPayouts.filter(p => p.status === "Pending");
    const nextRemittanceAmount = pendingPayouts.length > 0
      ? pendingPayouts.reduce((sum, p) => sum + p.netRemitted, 0)
      : 27261.10;

    // Calculate totalOutstanding dynamically based on delivered/fulfilled COD orders, or default to mockup values
    const outstandingAggregate = await prisma.order.aggregate({
      where: {
        userId,
        method: "COD",
        status: { in: ["fulfilled", "delivered"] }
      },
      _sum: {
        collectableAmount: true
      }
    });
    
    const totalOutstanding = outstandingAggregate._sum.collectableAmount || 65310.70;

    return res.status(200).json({
      success: true,
      data: userPayouts,
      totalOutstanding,
      nextRemittanceAmount
    });
  } catch (error) {
    next(error);
  }
};
