import * as delhivery from "./delhiveryService.js";
import * as xpressbees from "./xpressbeesService.js";
import * as amazon from "./amazonService.js";
import * as bluedart from "./bluedartService.js";

/**
 * Fetch and combine live rates from all serviceable courier partners
 */
export const getLiveRates = async ({ originPincode, destPincode, weight, cod }) => {
  const providers = [
    { service: delhivery, name: "delhivery" },
    { service: xpressbees, name: "xpressbees" },
    { service: amazon, name: "amazon" },
    { service: bluedart, name: "bluedart" }
  ];

  // Check if at least one provider has a real, non-mock API key set
  const hasRealConfiguredProvider = providers.some(p => !p.service.isMockMode);

  const promises = [];
  providers.forEach(p => {
    if (!p.service.isMockMode || !hasRealConfiguredProvider) {
      promises.push(p.service.fetchRates({ originPincode, destPincode, weight, cod }));
    }
  });

  const results = await Promise.allSettled(promises);
  const activeRates = [];

  results.forEach((res) => {
    if (res.status === "fulfilled" && res.value) {
      activeRates.push(res.value);
    }
  });

  // Sort by price (cheapest first)
  return activeRates.sort((a, b) => a.price - b.price);
};

/**
 * Book shipment with a selected courier partner
 */
export const bookShipment = async ({ courierPartner, order, pickupWarehouse, rtoWarehouse }) => {
  const partnerName = (courierPartner || "Auto Assigned").toLowerCase();
  
  let targetService = null;

  if (partnerName.includes("xpressbees")) {
    targetService = xpressbees;
  } else if (partnerName.includes("amazon")) {
    targetService = amazon;
  } else if (partnerName.includes("delhivery")) {
    targetService = delhivery;
  } else if (partnerName.includes("bluedart")) {
    targetService = bluedart;
  } else {
    // Auto Assign logic: Fetch rates first, choose the cheapest serviceable one
    try {
      const rates = await getLiveRates({
        originPincode: "110001", // Default hub pincode
        destPincode: order.pincode || "400001",
        weight: order.weight || 0.5,
        cod: order.method === "COD"
      });

      if (rates && rates.length > 0) {
        const cheapest = rates[0];
        if (cheapest.id === "xpressbees") targetService = xpressbees;
        else if (cheapest.id === "amazon") targetService = amazon;
        else if (cheapest.id === "delhivery") targetService = delhivery;
        else if (cheapest.id === "bluedart") targetService = bluedart;
      }
    } catch (err) {
      console.error("Auto Assign routing failed, falling back to Delhivery:", err.message);
    }

    // Default fallback if auto-assign could not resolve
    if (!targetService) {
      targetService = delhivery;
    }
  }

  // Call the appropriate courier shipment creation
  return targetService.createShipment({ order, pickupWarehouse, rtoWarehouse });
};
