import { useEffect } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import { isHtmlBody } from '../lib/htmlContent'

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`min-h-[32px] min-w-[32px] rounded px-2 text-xs font-semibold transition-colors ${
        active
          ? 'bg-gray-900 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null

  const promptUrl = (label: string) => {
    const url = window.prompt(label)
    return url?.trim() || null
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-gray-200" />
      <ToolbarButton
        title="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        title="Blockquote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        “
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-gray-200" />
      <ToolbarButton
        title="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        title="Divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        —
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-gray-200" />
      <ToolbarButton
        title="Link"
        active={editor.isActive('link')}
        onClick={() => {
          const url = promptUrl('Link URL')
          if (!url) return
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
        }}
      >
        Link
      </ToolbarButton>
      <ToolbarButton
        title="Image"
        onClick={() => {
          const url = promptUrl('Image URL')
          if (!url) return
          editor.chain().focus().setImage({ src: url, alt: 'image' }).run()
        }}
      >
        Img
      </ToolbarButton>
      <ToolbarButton
        title="YouTube"
        onClick={() => {
          const url = promptUrl('YouTube URL')
          if (!url) return
          editor.chain().focus().setYoutubeVideo({ src: url }).run()
        }}
      >
        YT
      </ToolbarButton>
    </div>
  )
}

type Props = {
  value: string
  onChange: (html: string) => void
  onEditorReady?: (editor: Editor | null) => void
  placeholder?: string
}

const EMPTY_DOC = '<p></p>'

function bodyToEditorContent(value: string): string {
  if (!value.trim()) return EMPTY_DOC
  if (isHtmlBody(value)) return value
  const escaped = value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<p>${escaped.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`
}

function normalizeEditorHtml(html: string): string {
  const t = html.trim()
  if (!t || t === '<p></p>') return EMPTY_DOC
  return html
}

export default function ContentRichEditor({
  value,
  onChange,
  onEditorReady,
  placeholder = 'Write your article…',
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
          class: 'article-link',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: 'article-image' },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        modestBranding: true,
        HTMLAttributes: { class: 'article-youtube' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: bodyToEditorContent(value),
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content min-h-[280px] max-w-none px-4 py-3 focus:outline-none text-[15px] leading-relaxed text-gray-800',
      },
    },
  })

  useEffect(() => {
    onEditorReady?.(editor ?? null)
  }, [editor, onEditorReady])

  useEffect(() => {
    if (!editor) return
    const incoming = normalizeEditorHtml(bodyToEditorContent(value))
    const current = normalizeEditorHtml(editor.getHTML())
    if (incoming !== current) {
      editor.commands.setContent(incoming, { emitUpdate: false })
    }
  }, [value, editor])

  return (
    <div className="content-rich-editor overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

export function insertImageInEditor(editor: Editor | null, url: string): boolean {
  if (!editor) return false
  return editor.chain().focus().setImage({ src: url, alt: 'image' }).run()
}
