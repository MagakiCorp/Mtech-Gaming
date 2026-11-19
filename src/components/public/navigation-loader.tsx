"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const MINIMUM_DISPLAY_TIME = 3000;
const NAVIGATION_TIMEOUT = 15000;

export default function NavigationLoader() {
  const pathname = usePathname();

  const [visible, setVisible] = useState(false);

  const startedAt = useRef<number | null>(null);
  const previousPathname = useRef(pathname);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function clearTimers() {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
        hideTimeout.current = null;
      }

      if (fallbackTimeout.current) {
        clearTimeout(fallbackTimeout.current);
        fallbackTimeout.current = null;
      }
    }

    function startLoading() {
      if (startedAt.current !== null) return;

      startedAt.current = performance.now();
      setVisible(true);

      fallbackTimeout.current = setTimeout(() => {
        startedAt.current = null;
        setVisible(false);
      }, NAVIGATION_TIMEOUT);
    }

    function handleNavigationClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) return;

      const link = target.closest("a[href]");

      if (!(link instanceof HTMLAnchorElement)) return;

      if (
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        link.rel === "external"
      ) {
        return;
      }

      const destination = new URL(link.href, window.location.href);

      if (destination.origin !== window.location.origin) return;

      // Ignore hash-only navigation and links to the current route.
      if (destination.pathname === window.location.pathname) return;

      startLoading();
    }

    function handlePopState() {
      startLoading();
    }

    document.addEventListener("click", handleNavigationClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleNavigationClick, true);
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (previousPathname.current === pathname) return;

    previousPathname.current = pathname;

    // Also handle programmatic navigation that wasn't triggered by a link.
    if (startedAt.current === null) {
      startedAt.current = performance.now();
      setVisible(true);
    }

    const elapsed = performance.now() - startedAt.current;
    const remaining = Math.max(0, MINIMUM_DISPLAY_TIME - elapsed);

    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }

    hideTimeout.current = setTimeout(() => {
      startedAt.current = null;
      setVisible(false);

      if (fallbackTimeout.current) {
        clearTimeout(fallbackTimeout.current);
        fallbackTimeout.current = null;
      }

      hideTimeout.current = null;
    }, remaining);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="public-state-screen fixed inset-0 z-[100]"
      role="status"
      aria-label="Loading website"
    >
      <div className="public-state-grid" />
      <div className="public-state-glow" />

      <div className="public-state-content">
        <div className="public-loading-symbols" aria-hidden="true">
          <span className="public-loading-symbol">○</span>
          <span className="public-loading-symbol">□</span>
          <span className="public-loading-symbol">×</span>
          <span className="public-loading-symbol">△</span>
        </div>

        <p className="public-loading-heading">Initializing</p>

        <p className="public-loading-description">
          Preparing your experience...
        </p>

        <div className="public-loading-track" aria-hidden="true">
          <div className="public-loading-bar" />
        </div>
      </div>
    </div>
  );
}
