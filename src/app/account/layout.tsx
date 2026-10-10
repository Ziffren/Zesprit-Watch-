import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="detail-header">
        <Link className="detail-header__back" href="/">
          ← Z&rsquo;esprit Watch
        </Link>
      </header>

      <main>{children}</main>

      <SiteFooter />
    </>
  );
}
