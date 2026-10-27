import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-[#fff0e9] text-[#e8643c]">
        <ShieldAlert size={32} />
      </div>
      <h1 className="mt-5 text-2xl font-bold">Access denied</h1>
      <p className="mt-2 max-w-sm text-sm text-[#8b7d72]">
        You do not have permission to view this page. Contact your administrator
        if you think this is a mistake.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-xl bg-[#e8643c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#df6038]"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
