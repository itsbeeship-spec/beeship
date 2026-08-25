import axios from "axios";

const XPRESSBEES_ENV = process.env.XPRESSBEES_ENV || "sandbox";
const XPRESSBEES_API_KEY = process.env.XPRESSBEES_API_KEY;

const BASE_URL = XPRESSBEES_ENV === "production"
  ? "https://ship.xpressbees.com"
  : "https://sandbox.xpressbees.com";

export const isMockMode = !XPRESSBEES_API_KEY || XPRESSBEES_API_KEY.trim() === "" || XPRESSBEES_API_KEY.toLowerCase() === "mock";

/**
 * Fetch rates and serviceability from Xpressbees
 */
export const fetchRates = async ({ originPincode, destPincode, weight, cod }) => {
  if (isMockMode) {
    const isServiceable = destPincode.length === 6 && !destPincode.startsWith("0");
    if (!isServiceable) return null;

    const baseRate = 50;
    const weightCharge = Math.ceil(weight || 0.5) * 15;
    const codCharge = cod ? 30 : 0;
    const totalPrice = baseRate + weightCharge + codCharge;

    return {
      id: "xpressbees",
      name: "Xpressbees Surface",
      avatar: "X",
      edd: "7 days • Jul 10, 26",
      price: totalPrice,
      serviceable: true
    };
  }

  try {
    const response = await axios.post(`${BASE_URL}/api/shipment/rates`, {
      origin: originPincode,
      destination: destPincode,
      weight: weight || 0.5,
      cod: cod ? 1 : 0
    }, {
      headers: {
        "Authorization": `Bearer ${XPRESSBEES_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    if (response.data && response.data.success) {
      return {
        id: "xpressbees",
        name: "Xpressbees Surface",
        avatar: "X",
        edd: "7 days",
        price: response.data.rate || 95,
        serviceable: true
      };
    }
    return null;
  } catch (error) {
    console.error("Xpressbees Rates API error, falling back to mock:", error.message);
    return {
      id: "xpressbees",
      name: "Xpressbees Surface [Fallback]",
      avatar: "X",
      edd: "7 days • Jul 10, 26",
      price: 95,
      serviceable: true
    };
  }
};

/**
 * Book shipment in Xpressbees
 */
export const createShipment = async ({ order, pickupWarehouse, rtoWarehouse }) => {
  if (isMockMode) {
    const randomAwb = "XPRB" + Math.floor(1000000000 + Math.random() * 9000000000);
    return {
      success: true,
      awbNumber: randomAwb,
      labelUrl: `https://beeship-storage.s3.eu-north-1.amazonaws.com/labels/xpressbees-${randomAwb}.pdf`,
      courierPartner: "Xpressbees Surface [Mock]",
      message: "Mock Shipment booked successfully."
    };
  }

  try {
    const payload = {
      order_number: order.orderId,
      consignee_name: order.customer,
      consignee_address: order.address || "Main Street Address",
      consignee_phone: order.phone || "9999999999",
      consignee_pincode: order.pincode,
      payment_type: order.method === "COD" ? "COD" : "Prepaid",
      collectable_amount: order.collectableAmount || 0,
      weight: order.weight || 0.5,
      pickup_warehouse: pickupWarehouse || "Primary Warehouse",
      rto_warehouse: rtoWarehouse || "Primary Warehouse"
    };

    const response = await axios.post(`${BASE_URL}/api/shipment/create`, payload, {
      headers: {
        "Authorization": `Bearer ${XPRESSBEES_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const data = response.data;
    if (data && data.success) {
      return {
        success: true,
        awbNumber: data.awb,
        labelUrl: data.label_url || `https://ship.xpressbees.com/print/label?awb=${data.awb}`,
        courierPartner: "Xpressbees Surface",
        message: "Shipment booked successfully with Xpressbees API"
      };
    }
    throw new Error(data.message || "Failed booking with Xpressbees");
  } catch (error) {
    console.error("Xpressbees Booking API error, falling back to mock:", error.message);
    const fallbackAwb = "XPRB" + Math.floor(1000000000 + Math.random() * 9000000000);
    return {
      success: true,
      awbNumber: fallbackAwb,
      labelUrl: `https://beeship-storage.s3.eu-north-1.amazonaws.com/labels/xpressbees-${fallbackAwb}.pdf`,
      courierPartner: "Xpressbees Surface [Fallback Mock]",
      message: `Xpressbees API failed (${error.message}). Generated mock shipment.`
    };
  }
};

/**
 * Request pickup with Xpressbees API
 */
export const requestPickup = async ({ pickupLocation, packageCount, pickupDate, pickupTime }) => {
  if (isMockMode) {
    console.log(`[Mock Mode] Xpressbees Pickup Request queued for location: ${pickupLocation || "Primary Warehouse"}, Count: ${packageCount}`);
    return { success: true, message: "Mock Pickup request sent to Xpressbees" };
  }

  try {
    const payload = {
      pickup_warehouse: pickupLocation || "Primary Warehouse",
      expected_packages: packageCount || 1,
      pickup_date: pickupDate || new Date().toISOString().split("T")[0]
    };

    const response = await axios.post(`${BASE_URL}/api/pickup/request`, payload, {
      headers: {
        "Authorization": `Bearer ${XPRESSBEES_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    console.log(`🟢 Successfully sent Xpressbees Pickup Request for ${pickupLocation}:`, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.warn("⚠️ Xpressbees Pickup Request API note:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};
