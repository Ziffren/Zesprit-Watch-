import { createClient } from "@/lib/supabase/server";
import { BRAND_LIST_SLOT, INFO_SLOT, LOGO_SLOT, SITE_IMAGE_COLUMNS, SITE_IMAGE_SLOTS, bySlot, type SiteImage } from "@/lib/site-images";
import { BrandListForm, type LinkOption } from "./brand-list-form";
import { LogoForm } from "./logo-form";
import { SlotForm } from "./slot-form";

export default async function SiteImagesPage() {
  const supabase = await createClient();
  const [{ data, error }, { data: cols }] = await Promise.all([
    supabase.from("site_images").select(SITE_IMAGE_COLUMNS),
    supabase.from("collections").select("name, slug, isBrand").order("name"),
  ]);
  // Brand collections first, then other collections, then the two shortcuts.
  const options: LinkOption[] = [
    ...(cols ?? []).filter((c) => c.isBrand).map((c) => ({ label: c.name, href: `/collections/${c.slug}` })),
    ...(cols ?? []).filter((c) => !c.isBrand).map((c) => ({ label: `${c.name} (collection)`, href: `/collections/${c.slug}` })),
    { label: "All watches", href: "/collections/all" },
    { label: "Sold list", href: "/collections/all?status=sold" },
    { label: "Contact page", href: "/contact" },
    { label: "Privacy page", href: "/privacy" },
    { label: "Journal", href: "/journal" },
    { label: "Watch Sourcing", href: "/sourcing" },
    { label: "Reviews", href: "/reviews" },
  ];
  const images = bySlot(data as Partial<SiteImage>[] | null);
  const live = SITE_IMAGE_SLOTS.filter((s) => images[s.slot].imageUrl).length;

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">Website images</p>
      </header>
      <div className="admin-content">
        <p className="admin-hint" style={{ marginBottom: "var(--space-lg)", maxWidth: "62ch" }}>
          The image areas of the site, in the order they appear. Each can hold several photos — more
          than one plays as a slideshow. Each saves on its own; an empty area simply isn&rsquo;t shown. {live}/{SITE_IMAGE_SLOTS.length} in use.
        </p>
        {error && (
          <p className="admin-form__error" role="alert">
            Couldn&rsquo;t load the image slots ({error.message}). Has the site_images SQL been run?
          </p>
        )}
        <div className="slot-list">
          {SITE_IMAGE_SLOTS.map((s) => (
            s.slot === INFO_SLOT ? (
              <BrandListForm key={s.slot} image={images[s.slot]} options={options} where={s.where} ratio={s.ratio} variant="info" />
            ) : s.slot === LOGO_SLOT ? (
              <LogoForm key={s.slot} image={images[s.slot]} where={s.where} ratio={s.ratio} />
            ) : s.slot === BRAND_LIST_SLOT ? (
              <BrandListForm key={s.slot} image={images[s.slot]} options={options} where={s.where} ratio={s.ratio} />
            ) : (
              <SlotForm key={s.slot} image={images[s.slot]} label={s.label} where={s.where} ratio={s.ratio} />
            )
          ))}
        </div>
      </div>
    </>
  );
}
