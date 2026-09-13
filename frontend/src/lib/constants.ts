export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Retail POS",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  currency: process.env.NEXT_PUBLIC_CURRENCY || "USD",
  currencySymbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$",
  defaultTaxRate: 0.1, // 10%
  defaultPageSize: 15,
};

export const PAYMENT_METHODS = [
  { id: "cash", label: "Cash" },
  { id: "credit_card", label: "Credit Card" },
  { id: "debit_card", label: "Debit Card" },
  { id: "bank_transfer", label: "Bank Transfer" },
  { id: "qr_code", label: "QR Code / Digital Wallet" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];

export const ORDER_STATUSES = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export const INVENTORY_ADJUSTMENT_TYPES = {
  ADD: "add",
  SUBTRACT: "subtract",
  CORRECTION: "correction",
  DAMAGE: "damage",
  LOSS: "loss",
} as const;
