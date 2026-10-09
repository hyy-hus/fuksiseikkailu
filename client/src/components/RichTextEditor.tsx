import * as React from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Bold, Italic, Link as LinkIcon, Unlink } from 'lucide-react'

import { cn } from '@/lib/utils'

interface RichTextEditorProps {
    value: string
    onChange: (html: string) => void
    placeholder?: string
    className?: string
}

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-amber-600 underline font-bold hover:text-amber-700',
                },
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
    })

    React.useEffect(() => {
        if (editor && editor.getHTML() !== value) {
            editor.commands.setContent(value || '', { emitUpdate: false })
        }
    }, [value, editor])

    if (!editor) return null

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)

        if (url === null) return
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }

    return (
        <div
            className={cn('flex min-h-[160px] flex-col rounded-md border-2 border-black bg-white overflow-hidden cursor-text', className)}
            onClick={() => editor.chain().focus().run()}
        >
            {/* Toolbar */}
            <div
                className="flex items-center gap-1 border-b-2 border-black bg-black/5 p-1.5 shrink-0"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn(
                        'rounded p-1 text-black hover:bg-black/10 transition-colors cursor-pointer',
                        editor.isActive('bold') && 'bg-amber-400 font-black border border-black'
                    )}
                    title="Bold"
                >
                    <Bold className="h-3.5 w-3.5" />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn(
                        'rounded p-1 text-black hover:bg-black/10 transition-colors cursor-pointer',
                        editor.isActive('italic') && 'bg-amber-400 font-black border border-black'
                    )}
                    title="Italic"
                >
                    <Italic className="h-3.5 w-3.5" />
                </button>

                <div className="h-4 w-px bg-black/20 mx-0.5" />

                <button
                    type="button"
                    onClick={setLink}
                    className={cn(
                        'rounded p-1 text-black hover:bg-black/10 transition-colors cursor-pointer',
                        editor.isActive('link') && 'bg-amber-400 font-black border border-black'
                    )}
                    title="Add Link"
                >
                    <LinkIcon className="h-3.5 w-3.5" />
                </button>

                {editor.isActive('link') && (
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().unsetLink().run()}
                        className="rounded p-1 text-black hover:bg-black/10 transition-colors cursor-pointer"
                        title="Remove Link"
                    >
                        <Unlink className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Editable Content */}
            <EditorContent
                editor={editor}
                className="flex-1 p-3 text-xs font-medium text-black [&_.ProseMirror]:min-h-[120px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:m-0"
            />
        </div>
    )
}
