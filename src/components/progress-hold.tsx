"use client";

import { useEffect } from "react";
import { navProgress } from "@/lib/nav-progress";

// Rendered inside loading skeletons: keeps the top bar running while the
// skeleton is on screen, and lets it finish once real content replaces it.
export function ProgressHold() {
  useEffect(() => {
    navProgress.hold();
    return () => navProgress.release();
  }, []);
  return null;
}
