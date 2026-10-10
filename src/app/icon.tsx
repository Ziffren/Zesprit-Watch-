import { siteIcon } from "@/lib/site-icon";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";
// Picks up a new logo within the hour; saving the logo also revalidates it.
export const revalidate = 3600;

export default function Icon() {
  return siteIcon(64);
}
