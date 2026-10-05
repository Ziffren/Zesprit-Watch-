"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import { createClient } from "@/lib/supabase/client";

// A constrained palette, not a full color picker — arbitrary text color in
// a brand-locked catalogue/journal risks breaking the Hallmark palette the
// rest of the site is built on. These four are the project's own tokens.
const TEXT_COLORS = [
  { label: "Ink", value: "var(--color-ink)" },
  { label: "Muted", value: "var(--color-muted)" },
  { label: "Oxblood", value: "var(--color-accent-2)" },
];

const HEADING_OPTIONS = [
  { label: "Paragraph", level: 0 as const },
  { label: "Heading", level: 2 as const },
  { label: "Subheading", level: 3 as const },
  { label: "Small heading", level: 4 as const },
];

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

export function RichTextEditor({
  name,
  initialHtml,
}: {
  name: string;
  initialHtml: string | null;
}) {
  const [html, setHtml] = useState(initialHtml ?? "");
  const [sourceMode, setSourceMode] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false, autolink: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
    ],
    content: initialHtml ?? "",
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  function syncFromSource(next: string) {
    setHtml(next);
    editor?.commands.setContent(next, { emitUpdate: false });
  }

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  async function handleImageFile(file: File) {
    setUploading(true);
    try {
      const supabase = createClient();
      const path = `editor/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error } = await supabase.storage.from("watch-photos").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("watch-photos").getPublicUrl(path);
      editor?.chain().focus().setImage({ src: data.publicUrl }).run();
    } catch {
      // Best-effort — the editor just won't gain an image if this fails.
    } finally {
      setUploading(false);
    }
  }

  const activeHeading =
    HEADING_OPTIONS.find((h) => h.level !== 0 && editor?.isActive("heading", { level: h.level }))?.level ?? 0;

  return (
    <div className="admin-editor">
      <div className="admin-editor__toolbar">
        <select
          className="admin-editor__format"
          aria-label="Text style"
          value={activeHeading}
          onChange={(e) => {
            const level = Number(e.target.value);
            if (level === 0) editor?.chain().focus().setParagraph().run();
            else editor?.chain().focus().toggleHeading({ level: level as 2 | 3 | 4 }).run();
          }}
        >
          {HEADING_OPTIONS.map((h) => (
            <option key={h.label} value={h.level}>
              {h.label}
            </option>
          ))}
        </select>

        <span className="admin-editor__sep" aria-hidden="true" />

        <button
          type="button"
          data-active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          data-active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          data-active={editor?.isActive("underline")}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          aria-label="Underline"
        >
          <u>U</u>
        </button>

        <div className="admin-editor__dropdown">
          <button
            type="button"
            aria-label="Text color"
            onClick={() => setColorMenuOpen((v) => !v)}
            onBlur={() => setTimeout(() => setColorMenuOpen(false), 150)}
          >
            <Icon>
              <path d="M3 13h10M4 10.5 7.2 3h1.6L12 10.5M5 8h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </Icon>
          </button>
          {colorMenuOpen && (
            <div className="admin-editor__menu">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  className="admin-editor__swatch"
                  style={{ background: c.value }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor?.chain().focus().setColor(c.value).run();
                    setColorMenuOpen(false);
                  }}
                  aria-label={c.label}
                />
              ))}
              <button
                type="button"
                className="admin-editor__swatch admin-editor__swatch--none"
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor?.chain().focus().unsetColor().run();
                  setColorMenuOpen(false);
                }}
                aria-label="Default color"
              />
            </div>
          )}
        </div>

        <span className="admin-editor__sep" aria-hidden="true" />

        <button
          type="button"
          data-active={editor?.isActive({ textAlign: "left" })}
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          aria-label="Align left"
        >
          <Icon>
            <path d="M2 4h12M2 7.33h8M2 10.67h12M2 14h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </Icon>
        </button>
        <button
          type="button"
          data-active={editor?.isActive({ textAlign: "center" })}
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          aria-label="Align center"
        >
          <Icon>
            <path d="M2 4h12M4 7.33h8M2 10.67h12M4 14h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </Icon>
        </button>
        <button
          type="button"
          data-active={editor?.isActive({ textAlign: "right" })}
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          aria-label="Align right"
        >
          <Icon>
            <path d="M2 4h12M6 7.33h8M2 10.67h12M6 14h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </Icon>
        </button>

        <span className="admin-editor__sep" aria-hidden="true" />

        <button type="button" data-active={editor?.isActive("link")} onClick={setLink} aria-label="Link">
          <Icon>
            <path
              d="M6.5 9.5 9.5 6.5M6.3 10.3 4.4 12.2a2 2 0 0 1-2.8-2.8l1.9-1.9a2 2 0 0 1 2.8 0M9.7 5.7l1.9-1.9a2 2 0 0 1 2.8 2.8l-1.9 1.9a2 2 0 0 1-2.8 0"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </Icon>
        </button>

        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          aria-label="Insert image"
          disabled={uploading}
        >
          <Icon>
            <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="5.5" cy="6.5" r="1" fill="currentColor" />
            <path d="m3 11.5 3-3 2.5 2.5L11.5 8 13 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </Icon>
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
            e.target.value = "";
          }}
        />

        <span className="admin-editor__sep" aria-hidden="true" />

        <button
          type="button"
          data-active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          aria-label="Bullet list"
        >
          <Icon>
            <circle cx="3" cy="4.5" r="1" fill="currentColor" />
            <circle cx="3" cy="8" r="1" fill="currentColor" />
            <circle cx="3" cy="11.5" r="1" fill="currentColor" />
            <path d="M6 4.5h8M6 8h8M6 11.5h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </Icon>
        </button>
        <button
          type="button"
          data-active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          aria-label="Numbered list"
        >
          <Icon>
            <path d="M6 4.5h8M6 8h8M6 11.5h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <text x="1" y="5.5" fontSize="4.5" fill="currentColor">1</text>
            <text x="1" y="9" fontSize="4.5" fill="currentColor">2</text>
            <text x="1" y="12.5" fontSize="4.5" fill="currentColor">3</text>
          </Icon>
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().liftListItem("listItem").run()}
          aria-label="Decrease indent"
        >
          <Icon>
            <path d="M2 4h12M6 8h8M2 8 4.5 6v4L2 8ZM6 12h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </Icon>
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().sinkListItem("listItem").run()}
          aria-label="Increase indent"
        >
          <Icon>
            <path d="M2 4h12M6 8h8M2 6v4l2.5-2L2 6ZM6 12h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </Icon>
        </button>

        <span className="admin-editor__sep" aria-hidden="true" />

        <button
          type="button"
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
          aria-label="Clear formatting"
        >
          <Icon>
            <path d="M3 3l10 10M7 3h6l-3 10M3 13h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </Icon>
        </button>
        <button
          type="button"
          data-active={sourceMode}
          onClick={() => setSourceMode((v) => !v)}
          aria-label="View HTML source"
        >
          <Icon>
            <path d="M5.5 4 2 8l3.5 4M10.5 4 14 8l-3.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </Icon>
        </button>
      </div>

      {sourceMode ? (
        <textarea
          className="admin-editor__source"
          value={html}
          onChange={(e) => syncFromSource(e.target.value)}
          spellCheck={false}
        />
      ) : (
        <EditorContent editor={editor} />
      )}

      <input type="hidden" name={name} value={html} readOnly />
    </div>
  );
}
