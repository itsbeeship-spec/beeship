/**
 * BeeShip Rate Calculation Engine
 * Professional Base Rate (First 0.5kg) + Additional Rate (Extra 0.5kg) Module.
 */

// 1. Calculate Volumetric Weight (L x W x H in cm / 5000)
export function calculateVolumetricWeight(length = 0, width = 0, height = 0) {
  const l = parseFloat(length) || 0;
  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;
  return (l * w * h) / 5000;
}

// 2. Get Final Chargable Weight (Higher of Physical vs Volumetric)
export function getChargableWeight(physicalWeight = 0, length = 0, width = 0, height = 0) {
  const physical = parseFloat(physicalWeight) || 0;
  const volumetric = calculateVolumetricWeight(length, width, height);
  return Math.max(physical, volumetric);
}

// 3. Resolve Zone based on Pincodes (City, State, Metro, Rest of India, NE/JK)
export function resolveShippingZone(sourcePincode = "", destPincode = "") {
  const src = String(sourcePincode).trim();
  const dest = String(destPincode).trim();

  // Same Pincode or City
  if (src === dest) {
    return "withinCity";
  }

  // Major Metro Prefix Pincodes (Delhi, Mumbai, Bangalore, Kolkata, Chennai, Hyderabad)
  const metroPrefixes = ["110", "400", "560", "700", "600", "500"];
  const srcIsMetro = metroPrefixes.some(p => src.startsWith(p));
  const destIsMetro = metroPrefixes.some(p => dest.startsWith(p));

  if (srcIsMetro && destIsMetro) {
    return "metroToMetro";
  }

  // North East & J&K Pincodes (Assam, J&K, Meghalaya, Manipur, Nagaland, etc.)
  if (dest.startsWith("78") || dest.startsWith("79") || dest.startsWith("18") || dest.startsWith("19")) {
    return "northEastAndJk";
  }

  // Same State (First 2 digits of pincode match)
  if (src.slice(0, 2) === dest.slice(0, 2)) {
    return "withinState";
  }

  // Default Inter-State
  return "restOfIndia";
}

/**
 * 4. Professional Freight Charge Calculation:
 * - First 0.5 kg: Base Rate (e.g. ₹40)
 * - Every Additional 0.5 kg: Additional Rate (e.g. ₹25)
 * If additionalRate is not specified, it falls back to baseRate.
 */
export function calculateFreightCharge(baseRate = 0, additionalRate = null, chargableWeight = 0, slabStep = 0.5) {
  const weight = Math.max(0.1, parseFloat(chargableWeight) || 0.5);
  const step = parseFloat(slabStep) || 0.5;
  
  const totalSlabs = Math.max(1, Math.ceil(weight / step));
  
  // First 0.5 kg slab -> Base Rate
  const firstSlabCost = baseRate;
  
  // Remaining slabs -> Additional Rate
  const extraSlabs = Math.max(0, totalSlabs - 1);
  const effectiveAddRate = (additionalRate !== null && additionalRate !== undefined && !isNaN(additionalRate))
    ? parseFloat(additionalRate)
    : baseRate;

  const extraSlabCost = extraSlabs * effectiveAddRate;
  const totalFreight = firstSlabCost + extraSlabCost;

  return {
    totalSlabs,
    firstSlabCost,
    extraSlabs,
    effectiveAddRate,
    weightUsed: weight,
    totalFreight: Math.round(totalFreight * 100) / 100
  };
}

// 5. Calculate COD Charges (Higher of Flat Fee vs Percentage)
export function calculateCodFee(orderAmount = 0, minCodFee = 35, codPercent = 2) {
  const amount = parseFloat(orderAmount) || 0;
  const percentFee = (amount * codPercent) / 100;
  const codFee = Math.max(minCodFee, percentFee);

  return Math.round(codFee * 100) / 100;
}

// 6. Complete Rate Estimator Function
export function estimateCourierRates({
  sourcePincode,
  destPincode,
  weight,
  length = 0,
  width = 0,
  height = 0,
  orderAmount = 0,
  paymentType = "Prepaid",
  rateCards = []
}) {
  const chargableWeight = getChargableWeight(weight, length, width, height);
  const zone = resolveShippingZone(sourcePincode, destPincode);
  const isCod = String(paymentType).toUpperCase() === "COD";

  const results = rateCards.map((rateCard) => {
    let baseRate = rateCard.withinCity;
    let addRate = rateCard.addWithinCity;

    if (zone === "withinState") {
      baseRate = rateCard.withinState;
      addRate = rateCard.addWithinState;
    } else if (zone === "metroToMetro") {
      baseRate = rateCard.metroToMetro;
      addRate = rateCard.addMetroToMetro;
    } else if (zone === "restOfIndia") {
      baseRate = rateCard.restOfIndia;
      addRate = rateCard.addRestOfIndia;
    } else if (zone === "northEastAndJk") {
      baseRate = rateCard.northEastAndJk;
      addRate = rateCard.addNorthEastAndJk;
    }

    const freightInfo = calculateFreightCharge(baseRate, addRate, chargableWeight, 0.5);
    const codFee = isCod ? calculateCodFee(orderAmount, rateCard.codCharges || 35, rateCard.codPercent || 2) : 0;
    const totalCost = Math.round((freightInfo.totalFreight + codFee) * 100) / 100;

    return {
      courier: rateCard.courier,
      zone,
      chargableWeight,
      totalSlabs: freightInfo.totalSlabs,
      baseRate,
      additionalRate: freightInfo.effectiveAddRate,
      freightCharge: freightInfo.totalFreight,
      codFee,
      totalCost
    };
  });

  return results;
}
