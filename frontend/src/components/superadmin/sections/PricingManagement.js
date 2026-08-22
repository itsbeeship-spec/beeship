"use client";

import SectionLayout from "../SectionLayout";
import DefaultRateCardsTab from "../pricing/DefaultRateCardsTab";
import SellerRateOverridesTab from "../pricing/SellerRateOverridesTab";
import CODChargesTab from "../pricing/CODChargesTab";
import AdditionalChargesTab from "../pricing/AdditionalChargesTab";
import CouponsTab from "./CouponsTab";

const SECTION = { title: "Pricing", icon: "🏷️", description: "Configure default courier rate sheets, custom seller overrides, COD fees, surcharges and coupon codes." };
const TABS = [
  { id: "default-rate-cards",   label: "Default Rate Cards",    href: "/superadmin/pricing/default-rate-cards", icon: "📦", description: "Default standard rate sheets per courier and zone.", features: ["Per-zone base freight rate", "Standard weight slab config", "RTO rate cards config"] },
  { id: "seller-rate-overrides",label: "Seller Rate Overrides", href: "/superadmin/pricing/seller-rate-overrides", icon: "👤", description: "Custom overrides negotiated with specific sellers.", features: ["Per-seller custom rate overrides", "Assign custom slab settings", "Effective rate audits"] },
  { id: "cod-charges",          label: "COD Charges",           href: "/superadmin/pricing/cod-charges", icon: "💵", description: "Cash on delivery collections fee configurations.", features: ["Set min COD charge per courier", "Set percentage collection fees", "Enable/disable COD by courier"] },
  { id: "additional-charges",   label: "Additional Charges",    href: "/superadmin/pricing/additional-charges", icon: "⛽", description: "Dynamic surcharges like fuel, ODA or RTO handling.", features: ["Configure fuel surcharge percentage", "Out of delivery area surcharges", "Surcharge log reports"] },
  { id: "coupons",              label: "Coupons",               href: "/superadmin/pricing/coupons", icon: "🎟️", description: "Promotional discount codes for wallet recharges.", features: ["Recharge bonus coupons", "Universal and seller-specific codes", "Usage analytics"] },
];

export default function PricingManagement({ activeTab }) {
  let content = null;
  if (activeTab === "default-rate-cards") {
    content = <DefaultRateCardsTab />;
  } else if (activeTab === "seller-rate-overrides") {
    content = <SellerRateOverridesTab />;
  } else if (activeTab === "cod-charges") {
    content = <CODChargesTab />;
  } else if (activeTab === "additional-charges") {
    content = <AdditionalChargesTab />;
  } else if (activeTab === "coupons") {
    content = <CouponsTab />;
  }

  return (
    <SectionLayout section={SECTION} tabs={TABS}>
      {content}
    </SectionLayout>
  );
}
