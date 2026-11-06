import DashboardView from "./_components/dashboard-view";

// The page sits behind a client-side AuthGuard, so the server never renders it.
// Opt out of Next.js instant-navigation validation to silence the dev error.
export const instant = false;

export default function DashboardPage() {
  return <DashboardView />;
}
