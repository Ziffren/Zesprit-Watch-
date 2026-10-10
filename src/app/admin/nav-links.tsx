"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const catalogueLinks = [
  { href: "/admin/products", label: "Products" },
  { href: "/admin/collections", label: "Collections" },
];

const salesLinks = [
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/deposits", label: "Deposits" },
  { href: "/admin/sourcing", label: "Sourcing" },
];

const contentLinks = [{ href: "/admin/content", label: "Journal" }];

const storeLinks = [{ href: "/admin/site-images", label: "Website images" }];

const insightsLinks = [{ href: "/admin/analytics", label: "Analytics" }];

const inboxLinks = [{ href: "/admin/messages", label: "Messages" }];

const reviewLinks = [{ href: "/admin/reviews", label: "Reviews" }];

export function AdminNav({ unreadMessageCount = 0 }: { unreadMessageCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Admin">
      <p className="admin-nav__group-label">Catalogue</p>
      {catalogueLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="admin-nav__link"
          data-active={pathname.startsWith(link.href)}
        >
          {link.label}
        </Link>
      ))}

      <p className="admin-nav__group-label">Sales</p>
      {salesLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="admin-nav__link"
          data-active={pathname.startsWith(link.href)}
        >
          {link.label}
        </Link>
      ))}

      <p className="admin-nav__group-label">Content</p>
      {contentLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="admin-nav__link"
          data-active={pathname.startsWith(link.href)}
        >
          {link.label}
        </Link>
      ))}

      <p className="admin-nav__group-label">Online store</p>
      {storeLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="admin-nav__link"
          data-active={pathname.startsWith(link.href)}
        >
          {link.label}
        </Link>
      ))}

      <p className="admin-nav__group-label">Insights</p>
      {insightsLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="admin-nav__link"
          data-active={pathname.startsWith(link.href)}
        >
          {link.label}
        </Link>
      ))}

      <p className="admin-nav__group-label">Inbox</p>
      {inboxLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="admin-nav__link"
          data-active={pathname.startsWith(link.href)}
        >
          {link.label}
          {unreadMessageCount > 0 && (
            <span className="admin-nav__unread-badge">{unreadMessageCount}</span>
          )}
        </Link>
      ))}
      {reviewLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="admin-nav__link"
          data-active={pathname.startsWith(link.href)}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
