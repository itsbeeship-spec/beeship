"use client";

import SectionLayout from "../SectionLayout";
import SellerWalletsTab from "../finance/SellerWalletsTab";
import TransactionsTab from "../finance/TransactionsTab";
import CODSettlementsTab from "../finance/CODSettlementsTab";
import CommissionsTab from "../finance/CommissionsTab";
import GSTInvoicesTab from "../finance/GSTInvoicesTab";

const SECTION = { title: "Wallet & Finance", icon: "💰", description: "Complete financial control — seller wallets, transactions, COD settlements, platform commissions, and GST reporting." };
const TABS = [
  { id: "wallets", label: "Seller Wallets", href: "/superadmin/finance/wallets", icon: "👛", description: "View and manage all seller wallet balances.", features: ["Real-time wallet balances", "Search seller by name or ID", "Transaction history per seller", "Flag low-balance wallets"] },
  { id: "transactions", label: "Transactions", href: "/superadmin/finance/transactions", icon: "📜", description: "Complete transaction ledger across all sellers.", features: ["Filter by type, date, seller", "Download transaction CSV", "Reconciliation reports", "Failed transaction alerts"] },
  { id: "cod-settlement", label: "COD Settlements", href: "/superadmin/finance/cod-settlement", icon: "💵", description: "Manage COD remittance cycles.", features: ["Settlement schedule management", "Per-courier COD tracking", "Auto-remittance to sellers", "Settlement dispute handling"] },
  { id: "commissions", label: "Commissions", href: "/superadmin/finance/commissions", icon: "🏦", description: "Platform commission configuration and tracking.", features: ["Set commission per plan", "Per-courier commission rules", "Monthly commission reports", "Revenue sharing configs"] },
  { id: "gst-invoices", label: "GST & Invoices", href: "/superadmin/finance/gst-invoices", icon: "🧾", description: "GST compliance reporting and invoice generation.", features: ["Monthly GSTR reports", "Tax invoice generation", "HSN code management", "Export for accountant"] },
];

export default function FinanceManagement({ activeTab }) {
  let content = null;
  if (activeTab === "wallets") {
    content = <SellerWalletsTab />;
  } else if (activeTab === "transactions") {
    content = <TransactionsTab />;
  } else if (activeTab === "cod-settlement") {
    content = <CODSettlementsTab />;
  } else if (activeTab === "commissions") {
    content = <CommissionsTab />;
  } else if (activeTab === "gst-invoices") {
    content = <GSTInvoicesTab />;
  }

  return (
    <SectionLayout section={SECTION} tabs={TABS}>
      {content}
    </SectionLayout>
  );
}
