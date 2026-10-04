"use client";

import { useState, type KeyboardEvent } from "react";

export function TagsField({ initialTags }: { initialTags: string[] }) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [draft, setDraft] = useState("");

  function addFromDraft() {
    const value = draft.trim();
    if (value && !tags.includes(value)) setTags((prev) => [...prev, value]);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addFromDraft();
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  return (
    <div className="admin-field">
      <span>Tags</span>
      {tags.map((tag) => (
        <input key={tag} type="hidden" name="tags" value={tag} />
      ))}
      <div className="admin-chip-list">
        {tags.map((tag) => (
          <span className="admin-chip" key={tag}>
            {tag}
            <button type="button" onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}>
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addFromDraft}
        placeholder="Type a tag, press Enter"
      />
    </div>
  );
}
