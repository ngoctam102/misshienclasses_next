import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Box, IconButton, Stack } from '@mui/material';
import {
    FormatBold,
    FormatItalic,
    FormatUnderlined,
    FormatListBulleted,
    FormatListNumbered,
    FormatAlignLeft,
    FormatAlignCenter,
    FormatAlignRight,
    FormatAlignJustify,
} from '@mui/icons-material';

interface TiptapEditorProps {
    content: string;
    onChange: (content: string) => void;
}

const TiptapEditor = ({ content, onChange }: TiptapEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <Box sx={{ border: '1px solid #ccc', borderRadius: 1 }}>
            <Stack direction="row" spacing={1} sx={{ p: 1, borderBottom: '1px solid #ccc' }}>
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    color={editor.isActive('bold') ? 'primary' : 'default'}
                >
                    <FormatBold />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    color={editor.isActive('italic') ? 'primary' : 'default'}
                >
                    <FormatItalic />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    color={editor.isActive('underline') ? 'primary' : 'default'}
                >
                    <FormatUnderlined />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    color={editor.isActive('bulletList') ? 'primary' : 'default'}
                >
                    <FormatListBulleted />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    color={editor.isActive('orderedList') ? 'primary' : 'default'}
                >
                    <FormatListNumbered />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
                >
                    <FormatAlignLeft />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
                >
                    <FormatAlignCenter />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
                >
                    <FormatAlignRight />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    color={editor.isActive({ textAlign: 'justify' }) ? 'primary' : 'default'}
                >
                    <FormatAlignJustify />
                </IconButton>
            </Stack>
            <Box sx={{ p: 2, minHeight: '200px' }}>
                <EditorContent editor={editor} />
            </Box>
        </Box>
    );
};

export default TiptapEditor; 