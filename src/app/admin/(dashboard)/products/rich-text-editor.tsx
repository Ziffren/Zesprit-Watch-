"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export function RichTextEditor({
  name,
  initialHtml,
}: {
  name: string;
  initialHtml: string | null;
}) {
  const [html, setHtml] = useState(initialHtml ?? "");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: initialHtml ?? "",
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  return (
    <div className="admin-editor">
      <div className="admin-editor__toolbar">
        <button
          type="button"
          data-active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          B
        </button>
        <button
          type="button"
          data-active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          I
        </button>
        <button
          type="button"
          data-active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          aria-label="Bullet list"
        >
          •
        </button>
        <button
          type="button"
          data-active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          aria-label="Numbered list"
        >
          1.
        </button>
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} readOnly />
    </div>
  );
}
