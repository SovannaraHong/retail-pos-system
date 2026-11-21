"use client";

import { useState } from "react";
import type { User } from "@/types/user";
import { initials } from "@/libs/format";

/** Shows the user's photo; falls back to initials when there is none or it fails to load. */
export function UserAvatar({
  user,
  className = "h-10 w-10",
}: {
  user: Pick<User, "name" | "image_url">;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = user.image_url;

  if (url && failedUrl !== url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        onError={() => setFailedUrl(url)}
        className={`${className} shrink-0 rounded-full bg-[#eef1f7] object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-sm font-semibold text-[#2f6fe8]`}
    >
      {initials(user.name)}
    </div>
  );
}
