import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, User, Edit, Trash2, BookOpen, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { BlogPostWithAuthor } from "@shared/schema";

export default function BlogPost() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("TUTORIAL");
  const [editImageUrl, setEditImageUrl] = useState("");
  
  const { data: post, isLoading } = useQuery<BlogPostWithAuthor>({
    queryKey: ['/api/blog', slug],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/blog/${slug}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog', slug] });
      toast({
        title: "Sucesso!",
        description: "Artigo atualizado com sucesso",
      });
      setEditOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar artigo",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/blog/${slug}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({
        title: "Sucesso!",
        description: "Artigo deletado com sucesso",
      });
      setLocation("/blog");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao deletar artigo",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditSlug(post.slug);
    setEditExcerpt(post.excerpt || "");
    setEditContent(post.content);
    setEditCategory(post.category || "TUTORIAL");
    setEditImageUrl(post.imageUrl || "");
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editTitle || !editContent || !editSlug) {
      toast({
        title: "Erro",
        description: "Preencha título, slug e conteúdo",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      title: editTitle,
      slug: editSlug,
      excerpt: editExcerpt,
      content: editContent,
      category: editCategory,
      imageUrl: editImageUrl || null,
    });
  };

  const canEdit = user && post && (user.id === post.authorId || user.isAdmin);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-muted rounded mb-8"></div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Artigo não encontrado</h2>
            <Link href="/blog">
              <Button variant="outline" data-testid="button-back-to-blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Blog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const readingTime = Math.ceil(post.content.split(' ').length / 200);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with back button and actions */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/blog">
            <Button variant="ghost" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          
          {canEdit && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEdit}
                data-testid="button-edit-post"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDeleteOpen(true)}
                className="text-destructive hover:text-destructive"
                data-testid="button-delete-post"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar
              </Button>
            </div>
          )}
        </div>

        {/* Category badge and reading time */}
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium" data-testid="post-category">
            {post.category || 'Tutorial'}
          </span>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span>{readingTime} min de leitura</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold mb-6 text-foreground" data-testid="post-title">
          {post.title}
        </h1>

        {/* Author and date */}
        <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-border">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={post.author.profileImageUrl || undefined} />
              <AvatarFallback>
                {post.author.firstName?.[0]?.toUpperCase() || 
                 post.author.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium" data-testid="post-author">
                  {post.author.firstName || "Autor"}
                </span>
                {post.author.isVerified && (
                  <span className="text-primary text-xs" title="Verificado">✓</span>
                )}
              </div>
              {post.author.jobTitle && (
                <p className="text-sm text-muted-foreground">{post.author.jobTitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm" data-testid="post-date">
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }) : ''}
            </span>
          </div>
        </div>

        {/* Featured image */}
        {post.imageUrl && (
          <div className="mb-8">
            <img 
              src={post.imageUrl} 
              alt={post.title}
              className="w-full h-auto rounded-lg shadow-lg"
              data-testid="post-image"
            />
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <div className="text-xl text-foreground/80 mb-8 italic border-l-4 border-primary pl-4" data-testid="post-excerpt">
            {post.excerpt}
          </div>
        )}

        {/* Content */}
        <div 
          className="prose prose-lg dark:prose-invert max-w-none text-foreground [&_*]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_p]:text-foreground [&_li]:text-foreground [&_ul]:text-foreground [&_ol]:text-foreground"
          dangerouslySetInnerHTML={{ __html: post.content }}
          data-testid="post-content"
        />

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/blog">
            <Button variant="outline" data-testid="button-back-footer">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ver mais artigos
            </Button>
          </Link>
        </div>
      </article>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Artigo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title">Título *</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Título do artigo"
                data-testid="input-edit-title"
              />
            </div>
            <div>
              <Label htmlFor="edit-slug">Slug (URL) *</Label>
              <Input
                id="edit-slug"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                placeholder="exemplo-de-slug"
                data-testid="input-edit-slug"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Categoria</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger data-testid="select-edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TUTORIAL">Tutorial</SelectItem>
                  <SelectItem value="TIPS">Dicas</SelectItem>
                  <SelectItem value="TECHNICAL_SUPPORT">Suporte Técnico</SelectItem>
                  <SelectItem value="FAQ">FAQ</SelectItem>
                  <SelectItem value="NEWS">Notícias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-imageUrl">URL da Imagem</Label>
              <Input
                id="edit-imageUrl"
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                data-testid="input-edit-image-url"
              />
            </div>
            <div>
              <Label htmlFor="edit-excerpt">Resumo</Label>
              <Textarea
                id="edit-excerpt"
                value={editExcerpt}
                onChange={(e) => setEditExcerpt(e.target.value)}
                placeholder="Breve resumo do artigo"
                rows={3}
                data-testid="textarea-edit-excerpt"
              />
            </div>
            <div>
              <Label>Conteúdo *</Label>
              <RichTextEditor
                content={editContent}
                onChange={setEditContent}
              />
            </div>
            <Button 
              onClick={handleUpdate} 
              disabled={updateMutation.isPending}
              className="w-full"
              data-testid="button-update-post"
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O artigo será permanentemente deletado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
