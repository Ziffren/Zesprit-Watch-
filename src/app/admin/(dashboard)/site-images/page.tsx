import { createClient } from "@/lib/supabase/server";
import { SITE_IMAGE_COLUMNS, SITE_IMAGE_SLOTS, bySlot, type SiteImage } from "@/lib/site-images";
import { SlotForm } from "./slot-form";
import { BulkUpload } from "./bulk-upload";

export default async function SiteImagesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_images").select(SITE_IMAGE_COLUMNS);
  const images = bySlot(data as Partial<SiteImage>[] | null);
  const live = SITE_IMAGE_SLOTS.filter((s) => images[s.slot].imageUrl).length;

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">Website images</p>
      </header>
      <div className="admin-content">
        <p className="admin-hint" style={{ marginBottom: "var(--space-lg)", maxWidth: "62ch" }}>
          The five image areas on the homepage, in the order they appear. Drop several photos at once below, or
          edit each area on its own; an empty area simply isn&rsquo;t shown. {live}/5 showing.
        </p>
        {error && (
          <p className="admin-form__error" role="alert">
            Couldn&rsquo;t load the image slots ({error.message}). Has the site_images SQL been run?
          </p>
        )}
        <BulkUpload
          filled={SITE_IMAGE_SLOTS.filter((s) => images[s.slot].imageUrl).map((s) => s.slot)}
        />
        <div className="slot-list">
          {SITE_IMAGE_SLOTS.map((s) => (
            <SlotForm key={`${s.slot}-${images[s.slot].updatedAt ?? ""}`} image={images[s.slot]} label={s.label} where={s.where} ratio={s.ratio} />
          ))}
        </div>
      </div>
    </>
  );
}
