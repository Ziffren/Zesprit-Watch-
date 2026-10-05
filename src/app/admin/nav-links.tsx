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
];

const contentLinks = [{ href: "/admin/content", label: "Journal" }];

const comingSoon = [{ label: "Analytics" }, { label: "Messages" }];

export function AdminNav() {
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

      <p className="admin-nav__group-label">Roadmap</p>
      {comingSoon.map((item) => (
        <span key={item.label} className="admin-nav__link" data-soon="true">
          {item.label}
          <span className="admin-nav__soon-badge">Soon</span>
        </span>
      ))}
    </nav>
  );
}
