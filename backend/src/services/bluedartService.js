import axios from "axios";

const BLUEDART_ENV = process.env.BLUEDART_ENV || "sandbox";
const BLUEDART_API_KEY = process.env.BLUEDART_API_KEY;

const BASE_URL = BLUEDART_ENV === "production"
  ? "https://api.bluedart.com/shipping/v1"
  : "https://sandbox.api.bluedart.com/shipping/v1";

export const isMockMode = !BLUEDART_API_KEY || BLUEDART_API_KEY.trim() === "" || BLUEDART_API_KEY.toLowerCase() === "mock";

/**
 * Fetch rates and serviceability from Bluedart
 */
export const fetchRates = async ({ originPincode, destPincode, weight, cod }) => {
  if (isMockMode) {
    const isServiceable = destPincode.length === 6 && !destPincode.startsWith("0");
    if (!isServiceable) return null;

    const baseRate = 75;
    const weightCharge = Math.ceil(weight || 0.5) * 15;
    const codCharge = cod ? 20 : 0;
    const totalPrice = baseRate + weightCharge + codCharge;

    return {
      id: "bluedart",
      name: "Bluedart Surface (N)",
      avatar: "B",
      edd: "7 days • Jul 10, 26",
      price: totalPrice,
      serviceable: true
    };
  }

  try {
    const response = await axios.post(`${BASE_URL}/transit-time-rates`, {
      origin: originPincode,
      destination: destPincode,
      weight: weight || 0.5,
      cod: cod ? "Y" : "N"
    }, {
      headers: {
        "x-bluedart-api-key": BLUEDART_API_KEY,
        "Content-Type": "application/json"
      }
    });

    if (response.data && response.data.rate) {
      return {
        id: "bluedart",
        name: "Bluedart Surface (N)",
        avatar: "B",
        edd: "7 days",
        price: response.data.rate || 110,
        serviceable: true
      };
    }
    return null;
  } catch (error) {
    console.error("Bluedart Rates API error, falling back to mock:", error.message);
    return {
      id: "bluedart",
      name: "Bluedart Surface (N) [Fallback]",
      avatar: "B",
      edd: "7 days • Jul 10, 26",
      price: 110,
      serviceable: true
    };
  }
};

/**
 * Book shipment in Bluedart
 */
export const createShipment = async ({ order, pickupWarehouse, rtoWarehouse }) => {
  if (isMockMode) {
    const randomAwb = "BLUD" + Math.floor(1000000000 + Math.random() * 9000000000);
    return {
      success: true,
      awbNumber: randomAwb,
      labelUrl: `https://beeship-storage.s3.eu-north-1.amazonaws.com/labels/bluedart-${randomAwb}.pdf`,
      courierPartner: "Bluedart Surface (N) [Mock]",
      message: "Mock Shipment booked successfully."
    };
  }

  try {
    const payload = {
      orderId: order.orderId,
      shipper: {
        name: pickupWarehouse || "Primary Warehouse",
      },
      consignee: {
        name: order.customer,
        address: order.address || "Main Street Address",
        pincode: order.pincode,
        phone: order.phone || "9999999999"
      },
      paymentMode: order.method === "COD" ? "COD" : "Prepaid",
      declaredValue: order.amount,
      weight: order.weight || 0.5
    };

    const response = await axios.post(`${BASE_URL}/shipments`, payload, {
      headers: {
        "x-bluedart-api-key": BLUEDART_API_KEY,
        "Content-Type": "application/json"
      }
    });

    const data = response.data;
    if (data && data.awbNo) {
      return {
        success: true,
        awbNumber: data.awbNo,
        labelUrl: data.label_url || `https://api.bluedart.com/label/${data.awbNo}`,
        courierPartner: "Bluedart Surface (N)",
        message: "Shipment booked successfully with Bluedart API"
      };
    }
    throw new Error("Invalid response format from Bluedart API");
  } catch (error) {
    console.error("Bluedart Booking API error, falling back to mock:", error.message);
    const fallbackAwb = "BLUD" + Math.floor(1000000000 + Math.random() * 9000000000);
    return {
      success: true,
      awbNumber: fallbackAwb,
      labelUrl: `https://beeship-storage.s3.eu-north-1.amazonaws.com/labels/bluedart-${fallbackAwb}.pdf`,
      courierPartner: "Bluedart Surface (N) [Fallback Mock]",
      message: `Bluedart API failed (${error.message}). Generated mock shipment.`
    };
  }
};
