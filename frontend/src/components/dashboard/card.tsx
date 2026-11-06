import Link from "next/link";

export const card =
  "rounded-2xl border border-[#e9eef7] bg-white p-5 shadow-[0_1px_3px_rgba(30,60,120,0.05)]";

export function CardHeader({
  title,
  href,
  linkLabel,
  right,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-sm font-bold text-[#1c2740]">{title}</h2>
      {right}
      {href && (
        <Link
          href={href}
          className="text-xs font-semibold text-[#1d5fe0] hover:underline"
        >
          {linkLabel ?? "View All"}
        </Link>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-[#eef2f9] ${className}`} />
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="py-10 text-center text-xs text-[#7d8aa1]">{text}</p>;
}
