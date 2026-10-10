import { siteIcon } from "@/lib/site-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const revalidate = 3600;

export default function AppleIcon() {
  return siteIcon(180);
}
