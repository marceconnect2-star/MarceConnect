import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Youtube } from '@tiptap/extension-youtube';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { common, createLowlight } from 'lowlight';
import type { LanguageFn } from 'highlight.js';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Code, 
  Quote, 
  Undo, 
  Redo,
  Table as TableIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useState, useCallback } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// Custom G-code language definition for syntax highlighting
const gcodeLanguage: LanguageFn = () => ({
  case_insensitive: true,
  keywords: {
    keyword: [
      'G0', 'G1', 'G2', 'G3', 'G4', 'G17', 'G18', 'G19', 'G20', 'G21',
      'G28', 'G30', 'G40', 'G41', 'G42', 'G43', 'G49', 'G53', 'G54',
      'G55', 'G56', 'G57', 'G58', 'G59', 'G80', 'G81', 'G82', 'G83',
      'G90', 'G91', 'G92', 'G93', 'G94',
      'M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9',
      'M30', 'M48', 'M49', 'M98', 'M99',
    ],
  },
  contains: [
    {
      className: 'comment',
      begin: /[;(]/,
      end: /[\n)]/,
    },
    {
      className: 'number',
      begin: /[XYZIJKFRSTP]-?\d+\.?\d*/,
      relevance: 0,
    },
    {
      className: 'string',
      begin: /N\d+/,
    },
  ],
});

const lowlight = createLowlight(common);
lowlight.register('gcode', gcodeLanguage);

export function RichTextEditor({ content, onChange, placeholder = "Escreva aqui..." }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);

  // Hook para upload de imagem com redimensionamento automático
  const { uploadImage, uploading: uploadingImage } = useImageUpload({
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'gcode',
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert max-w-none focus:outline-none min-h-[200px] p-4 text-white',
      },
    },
  });

  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setLinkDialogOpen(false);
    }
  }, [editor, linkUrl]);

  const addImage = useCallback(async () => {
    if (!editor) return;
    
    try {
      let finalImageUrl = imageUrl;
      
      // If user selected a file, upload it with auto-resize
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }
      
      if (finalImageUrl) {
        editor.chain().focus().setImage({ src: finalImageUrl }).run();
        setImageUrl('');
        setImageFile(null);
        setImageDialogOpen(false);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }, [editor, imageUrl, imageFile, uploadImage]);

  const addYoutube = useCallback(() => {
    if (youtubeUrl && editor) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
      setYoutubeUrl('');
      setYoutubeDialogOpen(false);
    }
  }, [editor, youtubeUrl]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-background" data-testid="rich-text-editor">
      <div className="border-b bg-muted p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-accent' : ''}
          data-testid="editor-bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-accent' : ''}
          data-testid="editor-italic"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
          data-testid="editor-h1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
          data-testid="editor-h2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
          data-testid="editor-h3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-accent' : ''}
          data-testid="editor-bullet-list"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-accent' : ''}
          data-testid="editor-ordered-list"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'bg-accent' : ''}
          data-testid="editor-code-block"
        >
          <Code className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-accent' : ''}
          data-testid="editor-blockquote"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
          data-testid="editor-table"
        >
          <TableIcon className="h-4 w-4" />
        </Button>

        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={editor.isActive('link') ? 'bg-accent' : ''}
              data-testid="editor-link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://exemplo.com"
                  data-testid="input-link-url"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={addLink} data-testid="button-add-link">
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="editor-image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Imagem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="image-file">Fazer Upload de Imagem</Label>
                <Input
                  id="image-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImageUrl('');
                    }
                  }}
                  className="cursor-pointer"
                  data-testid="input-image-file"
                />
                {imageFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Arquivo selecionado: {imageFile.name}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t" />
                <span className="text-sm text-muted-foreground">OU</span>
                <div className="flex-1 border-t" />
              </div>
              
              <div>
                <Label htmlFor="image-url">URL da Imagem</Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageFile(null);
                  }}
                  placeholder="https://exemplo.com/imagem.jpg"
                  data-testid="input-image-url"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                onClick={addImage} 
                disabled={uploadingImage || (!imageFile && !imageUrl)}
                data-testid="button-add-image"
              >
                {uploadingImage ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Enviando...
                  </>
                ) : (
                  'Adicionar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={youtubeDialogOpen} onOpenChange={setYoutubeDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="editor-youtube"
            >
              <YoutubeIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Vídeo do YouTube</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="youtube-url">URL do YouTube</Label>
                <Input
                  id="youtube-url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  data-testid="input-youtube-url"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={addYoutube} data-testid="button-add-youtube">
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          data-testid="editor-undo"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          data-testid="editor-redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
