import axios from "axios";

const AMAZON_SHIPPING_ENV = process.env.AMAZON_SHIPPING_ENV || "sandbox";
const AMAZON_SHIPPING_API_KEY = process.env.AMAZON_SHIPPING_API_KEY;

const BASE_URL = AMAZON_SHIPPING_ENV === "production"
  ? "https://api.amazon.com/shipping/v1"
  : "https://sandbox.api.amazon.com/shipping/v1";

export const isMockMode = !AMAZON_SHIPPING_API_KEY || AMAZON_SHIPPING_API_KEY.trim() === "" || AMAZON_SHIPPING_API_KEY.toLowerCase() === "mock";

/**
 * Fetch rates and serviceability from Amazon Shipping
 */
export const fetchRates = async ({ originPincode, destPincode, weight, cod }) => {
  if (isMockMode) {
    const isServiceable = destPincode.length === 6 && !destPincode.startsWith("0");
    if (!isServiceable) return null;

    const baseRate = 65;
    const weightCharge = Math.ceil(weight || 0.5) * 12;
    const codCharge = cod ? 20 : 0;
    const totalPrice = baseRate + weightCharge + codCharge;

    return {
      id: "amazon",
      name: "Amazon Shipping",
      avatar: "A",
      edd: "7 days • Jul 10, 26",
      price: totalPrice,
      serviceable: true
    };
  }

  try {
    const response = await axios.post(`${BASE_URL}/rates`, {
      shipFrom: { postalCode: originPincode },
      shipTo: { postalCode: destPincode },
      weight: { value: weight || 0.5, unit: "kg" }
    }, {
      headers: {
        "x-amzn-shipping-token": AMAZON_SHIPPING_API_KEY,
        "Content-Type": "application/json"
      }
    });

    if (response.data && response.data.rates) {
      return {
        id: "amazon",
        name: "Amazon Shipping",
        avatar: "A",
        edd: "7 days",
        price: response.data.rates[0]?.amount || 95,
        serviceable: true
      };
    }
    return null;
  } catch (error) {
    console.error("Amazon Shipping Rates API error, falling back to mock:", error.message);
    return {
      id: "amazon",
      name: "Amazon Shipping [Fallback]",
      avatar: "A",
      edd: "7 days • Jul 10, 26",
      price: 95,
      serviceable: true
    };
  }
};

/**
 * Book shipment in Amazon Shipping
 */
export const createShipment = async ({ order, pickupWarehouse, rtoWarehouse }) => {
  if (isMockMode) {
    const randomAwb = "AMZN" + Math.floor(1000000000 + Math.random() * 9000000000);
    return {
      success: true,
      awbNumber: randomAwb,
      labelUrl: `https://beeship-storage.s3.eu-north-1.amazonaws.com/labels/amazon-${randomAwb}.pdf`,
      courierPartner: "Amazon Shipping [Mock]",
      message: "Mock Shipment booked successfully."
    };
  }

  try {
    const payload = {
      orderId: order.orderId,
      shipTo: {
        name: order.customer,
        addressLine1: order.address || "Main Street Address",
        postalCode: order.pincode,
        phoneNumber: order.phone || "9999999999"
      },
      pickupWarehouse,
      rtoWarehouse
    };

    const response = await axios.post(`${BASE_URL}/shipments`, payload, {
      headers: {
        "x-amzn-shipping-token": AMAZON_SHIPPING_API_KEY,
        "Content-Type": "application/json"
      }
    });

    const data = response.data;
    if (data && data.shipmentId) {
      return {
        success: true,
        awbNumber: data.trackingId || data.shipmentId,
        labelUrl: data.label_url || `https://api.amazon.com/shipping/label/${data.shipmentId}`,
        courierPartner: "Amazon Shipping",
        message: "Shipment booked successfully with Amazon Shipping API"
      };
    }
    throw new Error("Invalid response format from Amazon Shipping API");
  } catch (error) {
    console.error("Amazon Booking API error, falling back to mock:", error.message);
    const fallbackAwb = "AMZN" + Math.floor(1000000000 + Math.random() * 9000000000);
    return {
      success: true,
      awbNumber: fallbackAwb,
      labelUrl: `https://beeship-storage.s3.eu-north-1.amazonaws.com/labels/amazon-${fallbackAwb}.pdf`,
      courierPartner: "Amazon Shipping [Fallback Mock]",
      message: `Amazon API failed (${error.message}). Generated mock shipment.`
    };
  }
};
