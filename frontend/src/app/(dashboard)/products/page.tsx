import { ProductsView } from "./_components/products-view";

// Next.js 16 dev check ("instant navigation"): this page is all client-side,
// interactive UI, so we opt it out of that validation instead of faking a static shell.
export const instant = false;

export default function ProductsPage() {
  return <ProductsView />;
}
