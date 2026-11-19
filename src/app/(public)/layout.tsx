import { Suspense, type ReactNode } from "react";

import SiteHeader from "@/components/public/site-header";
import SiteFooter from "@/components/public/site-footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={null}>
        <SiteHeader />
      </Suspense>

      <div className="flex-1">{children}</div>

      <SiteFooter />
    </div>
  );
}
