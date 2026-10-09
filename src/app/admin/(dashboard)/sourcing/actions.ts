"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SOURCING_STATUSES } from "@/lib/sourcing";

export type UpdateSourcingState = { error: string | null; savedAt: number | null };

export async function updateSourcing(_prev: UpdateSourcingState, formData: FormData): Promise<UpdateSourcingState> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "").trim();
  if (!SOURCING_STATUSES.some((s) => s.value === status)) return { error: "Unknown status.", savedAt: null };

  const supabase = await createClient();
  const { error } = await supabase.from("sourcing_requests").update({ status }).eq("id", id);
  if (error) return { error: error.message, savedAt: null };

  // Private note lives in the admin-only sourcing_notes table (customers can
  // read their own request rows, so it can't sit on them).
  const noteResult = adminNote
    ? await supabase.from("sourcing_notes").upsert({ requestId: id, note: adminNote })
    : await supabase.from("sourcing_notes").delete().eq("requestId", id);
  if (noteResult.error) return { error: noteResult.error.message, savedAt: null };

  revalidatePath("/admin/sourcing");
  revalidatePath(`/admin/sourcing/${id}`);
  return { error: null, savedAt: Date.now() };
}
