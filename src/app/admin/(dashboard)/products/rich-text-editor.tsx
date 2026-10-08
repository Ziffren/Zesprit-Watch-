"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import Youtube from "@tiptap/extension-youtube";
import { createClient } from "@/lib/supabase/client";

// A constrained palette, not a full color picker — arbitrary text color in
// a brand-locked catalogue/journal risks breaking the Hallmark palette the
// rest of the site is built on. These are the project's own tokens.
const TEXT_COLORS = [
  { label: "Ink", value: "var(--color-ink)" },
  { label: "Muted", value: "var(--color-muted)" },
  { label: "Oxblood", value: "var(--color-accent-2)" },
];

type BlockKind = "paragraph" | 1 | 2 | 3 | 4 | "quote";
const BLOCKS: { kind: BlockKind; label: string }[] = [
  { kind: "paragraph", label: "Paragraph" },
  { kind: 1, label: "Heading 1" },
  { kind: 2, label: "Heading 2" },
  { kind: 3, label: "Heading 3" },
  { kind: 4, label: "Heading 4" },
  { kind: "quote", label: "Blockquote" },
];

type Align = "left" | "center" | "right" | "justify";
const ALIGNS: { value: Align; label: string; path: string }[] = [
  { value: "left", label: "Align left", path: "M2.5 4h11M2.5 7h7M2.5 10h11M2.5 13h7" },
  { value: "center", label: "Align center", path: "M2.5 4h11M4.5 7h7M2.5 10h11M4.5 13h7" },
  { value: "right", label: "Align right", path: "M2.5 4h11M6.5 7h7M2.5 10h11M6.5 13h7" },
  { value: "justify", label: "Justify", path: "M2.5 4h11M2.5 7h11M2.5 10h11M2.5 13h11" },
];

function Icon({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const Chevron = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Toolbar dropdown. Menu items use onMouseDown + preventDefault so the
// editor keeps its selection while the menu is open.
function Dropdown({
  label,
  trigger,
  wide = false,
  disabled = false,
  children,
}: {
  label: string;
  trigger: ReactNode;
  wide?: boolean;
  disabled?: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="rte__dropdown" ref={ref}>
      <button
        type="button"
        className={wide ? "rte__btn rte__btn--wide" : "rte__btn rte__btn--caret"}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
        <Chevron />
      </button>
      {open && (
        <div className="rte__menu" role="menu">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  onSelect,
  active,
  disabled,
  children,
}: {
  onSelect: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className="rte__menu-item"
      data-active={active || undefined}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
    >
      {children}
    </button>
  );
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="rte__btn"
      aria-label={label}
      title={label}
      aria-pressed={active}
      data-active={active || undefined}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function setBlock(editor: Editor, kind: BlockKind) {
  const chain = editor.chain().focus();
  if (kind === "paragraph") chain.setParagraph().run();
  else if (kind === "quote") chain.setParagraph().setBlockquote().run();
  else chain.setHeading({ level: kind }).run();
}

export function RichTextEditor({
  name,
  label,
  initialHtml,
}: {
  name: string;
  label: string;
  initialHtml: string | null;
}) {
  const labelId = useId();
  const [html, setHtml] = useState(initialHtml ?? "");
  const [sourceMode, setSourceMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // StarterKit v3 already bundles Link and Underline — configure them
      // here rather than registering them a second time.
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      TableKit.configure({ table: { resizable: false } }),
      Youtube.configure({ nocookie: true, width: 640, height: 360 }),
    ],
    content: initialHtml ?? "",
    editorProps: { attributes: { "aria-labelledby": labelId, role: "textbox", "aria-multiline": "true" } },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  // TipTap v3 doesn't re-render on every transaction; subscribe to exactly
  // the toolbar state we show so active buttons follow the cursor.
  const ui = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null;
      const block: BlockKind = e.isActive("blockquote")
        ? "quote"
        : (([1, 2, 3, 4] as const).find((l) => e.isActive("heading", { level: l })) ?? "paragraph");
      return {
        block,
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        link: e.isActive("link"),
        bullet: e.isActive("bulletList"),
        ordered: e.isActive("orderedList"),
        inTable: e.isActive("table"),
        align: (ALIGNS.find((a) => e.isActive({ textAlign: a.value }))?.value ?? "left") as Align,
        color: (e.getAttributes("textStyle").color as string | undefined) ?? null,
        hasSelection: !e.state.selection.empty,
        canIndent: e.can().sinkListItem("listItem"),
        canOutdent: e.can().liftListItem("listItem"),
      };
    },
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

  function insertVideo() {
    if (!editor) return;
    const url = window.prompt("YouTube video URL");
    if (!url) return;
    editor.chain().focus().setYoutubeVideo({ src: url }).run();
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

  const off = !editor || sourceMode;
  const currentBlock = BLOCKS.find((b) => b.kind === ui?.block) ?? BLOCKS[0];
  const currentAlign = ALIGNS.find((a) => a.value === ui?.align) ?? ALIGNS[0];

  return (
    <div className="admin-field">
      <span id={labelId}>{label}</span>
      <div className="rte" data-source={sourceMode || undefined}>
        <div className="rte__toolbar" role="toolbar" aria-label={`${label} formatting`}>
          <Dropdown label="Text style" wide disabled={off} trigger={<span className="rte__block-label">{currentBlock.label}</span>}>
            {(close) =>
              BLOCKS.map((b) => (
                <MenuItem
                  key={b.label}
                  active={b.kind === ui?.block}
                  onSelect={() => {
                    if (editor) setBlock(editor, b.kind);
                    close();
                  }}
                >
                  <span className={`rte__menu-block rte__menu-block--${b.kind}`}>{b.label}</span>
                </MenuItem>
              ))
            }
          </Dropdown>

          <span className="rte__sep" aria-hidden="true" />

          <ToolButton label="Bold" active={ui?.bold} disabled={off} onClick={() => editor?.chain().focus().toggleBold().run()}>
            <Icon><path d="M4.5 2.75h4.25a2.6 2.6 0 0 1 0 5.2H4.5zM4.5 7.95h5a2.65 2.65 0 0 1 0 5.3h-5z" /></Icon>
          </ToolButton>
          <ToolButton label="Italic" active={ui?.italic} disabled={off} onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <Icon><path d="M7 2.75h5M4 13.25h5M9.75 2.75l-3.5 10.5" /></Icon>
          </ToolButton>
          <ToolButton label="Underline" active={ui?.underline} disabled={off} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
            <Icon><path d="M4.5 2.5v5a3.5 3.5 0 0 0 7 0v-5M3.5 14h9" /></Icon>
          </ToolButton>
          <Dropdown
            label="Text color"
            disabled={off}
            trigger={
              <Icon>
                <path d="M4.5 11 8 2.75 11.5 11M5.6 8.5h4.8" />
                <path d="M3 14h10" stroke={ui?.color ?? "currentColor"} strokeWidth="1.75" />
              </Icon>
            }
          >
            {(close) => (
              <div className="rte__swatches">
                {TEXT_COLORS.map((c) => (
                  <MenuItem
                    key={c.label}
                    active={ui?.color === c.value}
                    onSelect={() => {
                      editor?.chain().focus().setColor(c.value).run();
                      close();
                    }}
                  >
                    <span className="rte__swatch" style={{ background: c.value }} />
                    {c.label}
                  </MenuItem>
                ))}
                <MenuItem
                  onSelect={() => {
                    editor?.chain().focus().unsetColor().run();
                    close();
                  }}
                >
                  <span className="rte__swatch rte__swatch--none" />
                  Default
                </MenuItem>
              </div>
            )}
          </Dropdown>

          <span className="rte__sep" aria-hidden="true" />

          <Dropdown label="Alignment" disabled={off} trigger={<Icon><path d={currentAlign.path} /></Icon>}>
            {(close) =>
              ALIGNS.map((a) => (
                <MenuItem
                  key={a.value}
                  active={a.value === ui?.align}
                  onSelect={() => {
                    editor?.chain().focus().setTextAlign(a.value).run();
                    close();
                  }}
                >
                  <Icon size={16}><path d={a.path} /></Icon>
                  {a.label}
                </MenuItem>
              ))
            }
          </Dropdown>

          <span className="rte__sep" aria-hidden="true" />

          <ToolButton label="Link" active={ui?.link} disabled={off || !(ui?.hasSelection || ui?.link)} onClick={setLink}>
            <Icon>
              <path d="M6.75 9.25a2.75 2.75 0 0 0 3.9.1l2-2a2.76 2.76 0 0 0-3.9-3.9l-.75.75" />
              <path d="M9.25 6.75a2.75 2.75 0 0 0-3.9-.1l-2 2a2.76 2.76 0 0 0 3.9 3.9l.75-.75" />
            </Icon>
          </ToolButton>
          <ToolButton label="Insert image" disabled={off || uploading} onClick={() => imageInputRef.current?.click()}>
            <Icon>
              <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2.5" />
              <circle cx="6" cy="6" r="1.1" />
              <path d="m2.5 11.5 3.25-3.25 2.5 2.5L10.5 8.5l3.25 3.25" />
            </Icon>
          </ToolButton>
          <ToolButton label="Insert video" disabled={off} onClick={insertVideo}>
            <Icon>
              <circle cx="8" cy="8" r="5.75" />
              <path d="M6.75 5.75v4.5L10.5 8z" />
            </Icon>
          </ToolButton>
          <Dropdown
            label="Table"
            disabled={off}
            trigger={
              <Icon>
                <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2" />
                <path d="M2.25 6h11.5M6 6v7.75M10 6v7.75" />
              </Icon>
            }
          >
            {(close) => {
              const run = (fn: (e: Editor) => void) => () => {
                if (editor) fn(editor);
                close();
              };
              return (
                <>
                  <MenuItem onSelect={run((e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}>
                    Insert table
                  </MenuItem>
                  <MenuItem disabled={!ui?.inTable} onSelect={run((e) => e.chain().focus().addRowAfter().run())}>
                    Add row below
                  </MenuItem>
                  <MenuItem disabled={!ui?.inTable} onSelect={run((e) => e.chain().focus().addColumnAfter().run())}>
                    Add column right
                  </MenuItem>
                  <MenuItem disabled={!ui?.inTable} onSelect={run((e) => e.chain().focus().deleteRow().run())}>
                    Delete row
                  </MenuItem>
                  <MenuItem disabled={!ui?.inTable} onSelect={run((e) => e.chain().focus().deleteColumn().run())}>
                    Delete column
                  </MenuItem>
                  <MenuItem disabled={!ui?.inTable} onSelect={run((e) => e.chain().focus().deleteTable().run())}>
                    Delete table
                  </MenuItem>
                </>
              );
            }}
          </Dropdown>
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

          <span className="rte__sep" aria-hidden="true" />

          <ToolButton label="Bullet list" active={ui?.bullet} disabled={off} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            <Icon>
              <path d="M6 4h7.5M6 8h7.5M6 12h7.5" />
              <path d="M2.75 4h.01M2.75 8h.01M2.75 12h.01" strokeWidth="1.75" />
            </Icon>
          </ToolButton>
          <ToolButton label="Numbered list" active={ui?.ordered} disabled={off} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
            <Icon>
              <path d="M6.5 4h7M6.5 8h7M6.5 12h7" />
              <path d="M2.5 2.75h1v2.5M2.25 5.25h1.75M2.25 9.5c.3-.9 1.75-.9 1.75 0 0 .6-1.75 1.25-1.75 1.75H4M2.25 12.25h1.5l-.75 1 .4.1c.65.2.35 1.15-.4 1.15h-.75" strokeWidth="1" />
            </Icon>
          </ToolButton>
          <ToolButton label="Decrease indent" disabled={off || !ui?.canOutdent} onClick={() => editor?.chain().focus().liftListItem("listItem").run()}>
            <Icon><path d="M2.5 3.5h11M7.5 6.5h6M7.5 9.5h6M2.5 12.5h11M5 6 3 8l2 2" /></Icon>
          </ToolButton>
          <ToolButton label="Increase indent" disabled={off || !ui?.canIndent} onClick={() => editor?.chain().focus().sinkListItem("listItem").run()}>
            <Icon><path d="M2.5 3.5h11M7.5 6.5h6M7.5 9.5h6M2.5 12.5h11M3 6l2 2-2 2" /></Icon>
          </ToolButton>

          <span className="rte__sep" aria-hidden="true" />

          <ToolButton label="Clear formatting" disabled={off} onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}>
            <Icon>
              <circle cx="8" cy="8" r="5.75" />
              <path d="m3.95 3.95 8.1 8.1" />
            </Icon>
          </ToolButton>

          <span className="rte__spacer" />

          <ToolButton label={sourceMode ? "Back to editor" : "Show HTML"} active={sourceMode} disabled={!editor} onClick={() => setSourceMode((v) => !v)}>
            <Icon><path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5M9 3l-2 10" /></Icon>
          </ToolButton>
        </div>

        {sourceMode ? (
          <textarea
            className="rte__source"
            aria-labelledby={labelId}
            value={html}
            onChange={(e) => syncFromSource(e.target.value)}
            spellCheck={false}
          />
        ) : (
          <EditorContent editor={editor} className="rte__content" />
        )}
      </div>

      <input type="hidden" name={name} value={html} readOnly />
    </div>
  );
}
