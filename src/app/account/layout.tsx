import Link from "next/link";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="detail-header">
        <Link className="detail-header__back" href="/">
          ← Z&rsquo;esprit Watch
        </Link>
      </header>

      <main>{children}</main>

      <footer className="foot-mast">
        <p className="wordmark">Z&rsquo;esprit Watch</p>
        <p className="tagline muted">Vintage watches, restored to keep time again.</p>
        <p className="links muted">
          <Link href="/journal">Journal</Link> · Care Guide · Contact
        </p>
      </footer>
    </>
  );
}
