"use client";

import { createClient } from "@/lib/supabase/client";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

const BUCKET = "watch-photos";
const MAX_BYTES = 50 * 1024 * 1024; // Supabase Free per-file limit

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

// Storage keys must be plain ASCII — Supabase rejects names like
// "Ảnh chụp Màn hình….png" or "スクリーンショット.png" with "Invalid key".
// So the original filename is never used: <prefix>/<year>/<uuid>.<ext>.
export function photoPath(prefix: string, file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  const ext = EXT_BY_TYPE[file.type] ?? (/^[a-z0-9]{2,5}$/.test(fromName) ? fromName : "jpg");
  return `${prefix}/${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
}

// Friendly checks before spending an upload.
export function checkPhoto(file: File): string | null {
  if (/heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
    return `${file.name}: HEIC photos don't display in most browsers — export as JPEG first (Photos → File → Export).`;
  }
  if (!file.type.startsWith("image/")) return `${file.name} isn't an image.`;
  if (file.size > MAX_BYTES) return `${file.name} is larger than 50 MB.`;
  return null;
}

// Uploads one photo straight to Supabase Storage with real byte progress
// (supabase-js doesn't expose progress, so this is a plain XHR to the same
// endpoint, signed with the admin's session). Resolves to the public URL.
export async function uploadPhoto(
  file: File,
  prefix: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const problem = checkPhoto(file);
  if (problem) throw new Error(problem);

  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your admin session expired — sign in again.");

  const path = photoPath(prefix, file);
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader("authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", supabaseAnonKey!);
    xhr.setRequestHeader("x-upsert", "false");
    // Unique, never-overwritten names — safe to cache for a year.
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.min(99, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = `Upload failed (${xhr.status}).`;
      try {
        message = JSON.parse(xhr.responseText).message ?? message;
      } catch {}
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("Network error — check the connection and retry."));
    xhr.send(file);
  });
  onProgress?.(100);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
