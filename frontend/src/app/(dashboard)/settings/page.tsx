"use client";

import { useEffect, useState } from "react";
import {
  Store,
  Receipt,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { SettingService } from "@/services/setting-service";
import type { StoreSettings } from "@/types/setting";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { useAuth } from "@/hooks/use-auth";
import { PageSkeleton } from "@/shared/page-skeleton";

export default function SettingsPage() {
  const { can } = useAuth();
  const { updateCachedSettings } = useStoreSettings();
  const canUpdate = can("settings.update") || can("admin");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<StoreSettings>({
    store_name: "",
    store_phone: "",
    store_address: "",
    store_email: "",
    tax_id: "",
    receipt_header: "",
    receipt_footer: "",
  });

  useEffect(() => {
    SettingService.get()
      .then((res) => {
        if (res.data) {
          setForm({
            store_name: res.data.store_name || "",
            store_phone: res.data.store_phone || "",
            store_address: res.data.store_address || "",
            store_email: res.data.store_email || "",
            tax_id: res.data.tax_id || "",
            receipt_header: res.data.receipt_header || "",
            receipt_footer: res.data.receipt_footer || "",
          });
        }
      })
      .catch((err) => setError(err?.message || "Failed to load settings."))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: keyof StoreSettings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await SettingService.update(form);
      if (res.data) {
        updateCachedSettings(res.data);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1c2740]">System & Store Settings</h1>
          <p className="text-xs text-[#7d8aa1]">
            Manage business identity, contact details, tax identifiers, and POS receipt layouts
          </p>
        </div>

        {canUpdate && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f6fe8] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d5fe0] disabled:opacity-50"
          >
            <Save size={16} />
            <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
          </button>
        )}
      </div>

      {/* Status Messages */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-[#b9eacc] bg-[#e3f6ea] p-4 text-xs font-semibold text-[#1f9d55] shadow-xs">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>Store settings have been saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-[#ffd5d9] bg-[#fff1f2] p-4 text-xs font-semibold text-[#d64545] shadow-xs">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Colorful Category Summary Cards (Matching Dashboard Style) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-[#e9eef7] bg-white p-5 shadow-[0_1px_3px_rgba(30,60,120,0.05)]">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#e8f0ff] text-[#2f6fe8]">
            <Building2 size={26} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#7d8aa1]">Active Store</p>
            <p className="truncate text-lg font-bold text-[#1c2740]">
              {form.store_name || "Retail Store"}
            </p>
            <p className="truncate text-[11px] font-semibold text-[#2f6fe8]">Brand identity</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-[#e9eef7] bg-white p-5 shadow-[0_1px_3px_rgba(30,60,120,0.05)]">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#e3f6ea] text-[#1f9d55]">
            <Receipt size={26} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#7d8aa1]">Receipt Template</p>
            <p className="truncate text-lg font-bold text-[#1c2740]">Thermal 80mm</p>
            <p className="truncate text-[11px] font-semibold text-[#1f9d55]">POS ready</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-[#e9eef7] bg-white p-5 shadow-[0_1px_3px_rgba(30,60,120,0.05)] sm:col-span-2 lg:col-span-1">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#efe8ff] text-[#7c4dd8]">
            <ShieldCheck size={26} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#7d8aa1]">Tax / VAT Number</p>
            <p className="truncate text-lg font-bold text-[#1c2740]">
              {form.tax_id || "Not configured"}
            </p>
            <p className="truncate text-[11px] font-semibold text-[#7c4dd8]">Commercial compliance</p>
          </div>
        </div>
      </section>

      {/* Main Settings Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Form: General Store Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Card: Business Profile */}
          <div className="rounded-2xl border border-[#e9eef7] bg-white p-6 shadow-[0_1px_3px_rgba(30,60,120,0.05)]">
            <div className="mb-5 flex items-center gap-2.5 border-b border-[#f0f3f9] pb-4">
              <Store className="text-[#2f6fe8]" size={20} />
              <div>
                <h2 className="text-sm font-bold text-[#1c2740]">Business & Store Profile</h2>
                <p className="text-xs text-[#7d8aa1]">Basic public business information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1c2740]">Store Name</label>
                <input
                  type="text"
                  placeholder="e.g. My Retail Shop"
                  value={form.store_name || ""}
                  onChange={(e) => handleChange("store_name", e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#c5d0e2] bg-white px-3 text-xs font-medium text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:ring-2 focus:ring-[#2f6fe8]/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1c2740]">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +855 12 345 678"
                  value={form.store_phone || ""}
                  onChange={(e) => handleChange("store_phone", e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#c5d0e2] bg-white px-3 text-xs font-medium text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:ring-2 focus:ring-[#2f6fe8]/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1c2740]">Official Email</label>
                <input
                  type="email"
                  placeholder="e.g. contact@store.com"
                  value={form.store_email || ""}
                  onChange={(e) => handleChange("store_email", e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#c5d0e2] bg-white px-3 text-xs font-medium text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:ring-2 focus:ring-[#2f6fe8]/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1c2740]">
                  Tax Identification Number (TIN / VAT)
                </label>
                <input
                  type="text"
                  placeholder="e.g. K001-9021882"
                  value={form.tax_id || ""}
                  onChange={(e) => handleChange("tax_id", e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#c5d0e2] bg-white px-3 text-xs font-medium text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:ring-2 focus:ring-[#2f6fe8]/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-[#1c2740]">Store Physical Address</label>
                <input
                  type="text"
                  placeholder="e.g. #123, Street 2004, Phnom Penh, Cambodia"
                  value={form.store_address || ""}
                  onChange={(e) => handleChange("store_address", e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#c5d0e2] bg-white px-3 text-xs font-medium text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:ring-2 focus:ring-[#2f6fe8]/20"
                />
              </div>
            </div>
          </div>

          {/* Card: Receipt Template Settings */}
          <div className="rounded-2xl border border-[#e9eef7] bg-white p-6 shadow-[0_1px_3px_rgba(30,60,120,0.05)]">
            <div className="mb-5 flex items-center gap-2.5 border-b border-[#f0f3f9] pb-4">
              <Receipt className="text-[#22b35e]" size={20} />
              <div>
                <h2 className="text-sm font-bold text-[#1c2740]">POS Receipt Customization</h2>
                <p className="text-xs text-[#7d8aa1]">Header notes and footer greetings printed on customer receipts</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1c2740]">
                  Receipt Header Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Welcome to Retail POS System!"
                  value={form.receipt_header || ""}
                  onChange={(e) => handleChange("receipt_header", e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#c5d0e2] bg-white px-3 text-xs font-medium text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:ring-2 focus:ring-[#2f6fe8]/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1c2740]">
                  Receipt Footer Greeting
                </label>
                <input
                  type="text"
                  placeholder="e.g. Thank you for shopping with us! Please come again."
                  value={form.receipt_footer || ""}
                  onChange={(e) => handleChange("receipt_footer", e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#c5d0e2] bg-white px-3 text-xs font-medium text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:ring-2 focus:ring-[#2f6fe8]/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview Card: Live Receipt Preview */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#e9eef7] bg-white p-6 shadow-[0_1px_3px_rgba(30,60,120,0.05)]">
            <h2 className="mb-3 text-sm font-bold text-[#1c2740]">Live Receipt Preview</h2>
            <p className="mb-4 text-xs text-[#7d8aa1]">
              Real-time preview of your printed customer thermal receipt
            </p>

            {/* Thermal Receipt Simulation */}
            <div className="rounded-xl border border-dashed border-[#c5d0e2] bg-[#fbfcfd] p-5 font-mono text-[11px] text-[#1c2740] shadow-inner">
              <div className="text-center">
                <p className="text-sm font-extrabold">{form.store_name || "YOUR STORE NAME"}</p>
                <p className="text-[10px] text-[#6c7a93]">{form.store_address || "Store Address Here"}</p>
                <p className="text-[10px] text-[#6c7a93]">Tel: {form.store_phone || "N/A"}</p>
                {form.tax_id && <p className="text-[10px] text-[#6c7a93]">VAT: {form.tax_id}</p>}
                {form.receipt_header && (
                  <p className="mt-2 text-[10px] italic text-[#2f6fe8]">{form.receipt_header}</p>
                )}
              </div>

              <div className="my-3 border-t border-dashed border-[#cbd5e1]" />

              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Item 1 (Example)</span>
                  <span>$12.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Item 2 (Example)</span>
                  <span>$8.50</span>
                </div>
              </div>

              <div className="my-3 border-t border-dashed border-[#cbd5e1]" />

              <div className="space-y-1 font-bold">
                <div className="flex justify-between text-xs">
                  <span>TOTAL:</span>
                  <span>$20.50</span>
                </div>
                <div className="flex justify-between text-[10px] text-[#1f9d55]">
                  <span>PAID (CASH):</span>
                  <span>$20.50</span>
                </div>
              </div>

              <div className="my-3 border-t border-dashed border-[#cbd5e1]" />

              <div className="text-center text-[10px]">
                <p className="italic text-[#6c7a93]">
                  {form.receipt_footer || "Thank you for shopping with us!"}
                </p>
                <p className="mt-1 text-[9px] text-[#94a3b8]">www.hongsovannara.store</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
