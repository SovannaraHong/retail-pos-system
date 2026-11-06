"use client";

import { Coffee, Package, ShoppingBag } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function WelcomeBanner() {
  const { user } = useAuth();
  const name = user?.name || user?.email || "there";

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#5181e8] to-[#f3f7ff] px-6 py-7 sm:px-8">
      <div className="relative z-10">
        <p className="text-lg font-semibold text-white">
          {greeting()}, <span aria-hidden>👋</span>
        </p>
        <h2 className="mt-1 text-[28px] font-extrabold tracking-tight text-white">
          {name}!
        </h2>
        <p className="mt-2 text-sm text-white">
          Here&apos;s how your store is doing today.
        </p>
      </div>

      {/* Decorative illustration */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-6 hidden items-end gap-4 sm:flex md:right-16"
      >
        {/* <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 text-[#22a05a]">
          <Coffee size={30} />
        </div> */}
        <div className="mb-3 flex h-[120px] w-[290px] items-center justify-center">
          <Image
            src="/store.png"
            alt="Store"
            width={350}
            height={990}
            className="object-contain"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex h-10 w-44 items-center gap-2 rounded-lg bg-[#1d5fe0] px-3 text-white shadow">
            <ShoppingBag size={16} />
            <span className="h-1.5 w-16 rounded-full bg-white/60" />
          </div>
          <div className="ml-4 flex h-10 w-44 items-center gap-2 rounded-lg bg-[#f5a524] px-3 text-white shadow">
            <Package size={16} />
            <span className="h-1.5 w-20 rounded-full bg-white/60" />
          </div>
          <div className="flex h-10 w-52 items-center gap-2 rounded-lg bg-[#2f6fe8] px-3 text-white shadow">
            <Package size={16} />
            <span className="h-1.5 w-24 rounded-full bg-white/60" />
          </div>
        </div>
      </div>
    </section>
  );
}
