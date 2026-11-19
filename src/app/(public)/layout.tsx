import { Suspense, type ReactNode } from "react";

import SiteHeader from "@/components/public/site-header";
import SiteFooter from "@/components/public/site-footer";
import NavigationLoader from "@/components/public/navigation-loader";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#08060f]">
      <Suspense fallback={null}>
        <NavigationLoader />
      </Suspense>

      <Suspense fallback={null}>
        <SiteHeader />
      </Suspense>

      <div className="flex-1">{children}</div>

      <SiteFooter />
    </div>
  );
}
