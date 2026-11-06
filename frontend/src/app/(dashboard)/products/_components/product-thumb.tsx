"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { initials } from "@/libs/format";

/** Shows the product image; falls back to initials when there is none or it fails to load. */
export function ProductThumb({
  product,
  className = "h-11 w-11",
}: {
  product: Pick<Product, "name" | "image_url">;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = product.image_url;

  if (url && failedUrl !== url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        onError={() => setFailedUrl(url)}
        className={`${className} shrink-0 rounded-lg bg-[#eef1f7] object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-lg bg-[#e8f0ff] text-sm font-semibold text-[#2f6fe8]`}
    >
      {initials(product.name)}
    </div>
  );
}
