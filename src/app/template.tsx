"use client";

import { ViewTransition } from "react";
import { usePathname } from "next/navigation";

// Storefront page transition: the old page fades out quickly, the new one
// rises in. Admin is excluded here — its shell (sidebar) must stay still, so
// admin pages animate inside the content card instead (see admin.css).
export default function RootTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return children;

  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
