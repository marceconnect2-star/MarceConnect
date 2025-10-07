import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BlogPostWithAuthor } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useImageUpload } from "@/hooks/useImageUpload";

// Helper function to strip HTML tags and get plain text
const stripHtml = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

export default function Blog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("TUTORIAL");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  
  // Hook para upload de imagens com redimensionamento automático
  const { uploadImage, uploading: uploadingImage } = useImageUpload({
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
  });
  
  const { data: posts, isLoading } = useQuery<BlogPostWithAuthor[]>({
    queryKey: ["/api/blog"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/blog", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({
        title: "Sucesso!",
        description: "Artigo criado com sucesso",
      });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar artigo",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setCategory("TUTORIAL");
    setImageUrl("");
    setSelectedImage(null);
    setImagePreview("");
    setSelectedFile(null);
    setFileUrl("");
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Criar preview local imediato
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setSelectedImage(file);

      // Upload com redimensionamento automático
      const url = await uploadImage(file);
      setImageUrl(url);
      
      toast({
        title: "Imagem carregada!",
        description: "Imagem otimizada e pronta para usar",
      });
    } catch (error) {
      setImagePreview("");
      setSelectedImage(null);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setSelectedImage(null);
    setImagePreview("");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo e tamanho do arquivo
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 50MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileUrl("");
  };

  const handleSubmit = async () => {
    if (!title || !content || !slug) {
      toast({
        title: "Erro",
        description: "Preencha título, slug e conteúdo",
        variant: "destructive",
      });
      return;
    }

    // Upload de arquivo se houver
    let uploadedFileUrl = fileUrl;
    if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const response = await fetch('/api/upload-file', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!response.ok) throw new Error('Falha ao fazer upload do arquivo');
        
        const data = await response.json();
        uploadedFileUrl = data.url;
      } catch (error) {
        toast({
          title: "Erro no upload",
          description: "Falha ao fazer upload do arquivo",
          variant: "destructive",
        });
        return;
      }
    }

    createPostMutation.mutate({
      title,
      slug,
      excerpt,
      content,
      category,
      imageUrl: imageUrl || null,
      fileUrl: uploadedFileUrl || null,
      fileName: selectedFile?.name || null,
      fileType: selectedFile?.type || null,
      fileSize: selectedFile?.size || null,
      isPublished: true,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="text-center flex-1">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 mx-auto">
              <i className="fas fa-newspaper text-3xl text-primary"></i>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="blog-page-title">
              Dicas & Tutoriais
            </h1>
            <p className="text-xl text-muted-foreground">
              Aprenda com os melhores da comunidade
            </p>
          </div>
          
          {user && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="ml-4" data-testid="button-create-post">
                  <i className="fas fa-pen-to-square mr-2"></i>
                  Criar Artigo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Artigo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="title" className="flex items-center">
                      <i className="fas fa-text text-muted-foreground mr-2 text-sm"></i>
                      Título *
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Título do artigo"
                      data-testid="input-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug" className="flex items-center">
                      <i className="fas fa-link text-muted-foreground mr-2 text-sm"></i>
                      Slug (URL) *
                    </Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="exemplo-de-slug"
                      data-testid="input-slug"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="flex items-center">
                      <i className="fas fa-tag text-muted-foreground mr-2 text-sm"></i>
                      Categoria
                    </Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger data-testid="select-category">
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
                    <Label className="flex items-center mb-2">
                      <i className="fas fa-image text-muted-foreground mr-2 text-sm"></i>
                      Imagem Destacada
                    </Label>
                    
                    {!imagePreview ? (
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="blog-image-upload"
                          data-testid="input-blog-image"
                          disabled={uploadingImage}
                        />
                        <label htmlFor="blog-image-upload" className="cursor-pointer block">
                          {uploadingImage ? (
                            <>
                              <i className="fas fa-spinner fa-spin text-4xl text-primary mb-3"></i>
                              <p className="text-sm text-muted-foreground">Otimizando imagem...</p>
                            </>
                          ) : (
                            <>
                              <i className="fas fa-cloud-arrow-up text-4xl text-primary mb-3"></i>
                              <p className="text-muted-foreground mb-2">
                                Clique para fazer upload da imagem
                              </p>
                              <p className="text-sm text-muted-foreground">
                                PNG, JPG ou WebP (máx. 10MB)
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Redimensionamento automático para 1920px
                              </p>
                            </>
                          )}
                        </label>
                      </div>
                    ) : (
                      <div className="relative group">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border border-border"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleRemoveImage}
                            data-testid="button-remove-blog-image"
                          >
                            <i className="fas fa-trash mr-2"></i>
                            Remover Imagem
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Upload de Arquivo */}
                  <div>
                    <Label className="flex items-center mb-2">
                      <i className="fas fa-paperclip text-muted-foreground mr-2 text-sm"></i>
                      Anexar Arquivo (Opcional)
                    </Label>
                    
                    {!selectedFile ? (
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="blog-file-upload"
                          data-testid="input-blog-file"
                        />
                        <label htmlFor="blog-file-upload" className="cursor-pointer block">
                          <i className="fas fa-file-arrow-up text-3xl text-primary mb-2"></i>
                          <p className="text-sm text-muted-foreground mb-1">
                            Clique para anexar um arquivo
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, DXF, STL, ZIP, etc. (máx. 50MB)
                          </p>
                        </label>
                      </div>
                    ) : (
                      <div className="border border-border rounded-lg p-4 flex items-center justify-between bg-muted/30">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <i className="fas fa-file text-primary"></i>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          data-testid="button-remove-blog-file"
                        >
                          <i className="fas fa-trash text-destructive"></i>
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="excerpt" className="flex items-center">
                      <i className="fas fa-align-left text-muted-foreground mr-2 text-sm"></i>
                      Resumo
                    </Label>
                    <Textarea
                      id="excerpt"
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="Breve resumo do artigo"
                      rows={3}
                      data-testid="textarea-excerpt"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center">
                      <i className="fas fa-edit text-muted-foreground mr-2 text-sm"></i>
                      Conteúdo *
                    </Label>
                    <RichTextEditor
                      content={content}
                      onChange={setContent}
                    />
                  </div>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={createPostMutation.isPending}
                    className="w-full"
                    data-testid="button-submit-post"
                  >
                    {createPostMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Criando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i>
                        Publicar Artigo
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Featured Articles */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-card border-border" data-testid={`skeleton-${i}`}>
                <div className="w-full h-48 bg-muted animate-pulse"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded animate-pulse mb-2"></div>
                  <div className="h-6 bg-muted rounded animate-pulse mb-4"></div>
                  <div className="h-4 bg-muted rounded animate-pulse mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Card key={post.id} className="bg-card border-border overflow-hidden hover:shadow-2xl hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 group" data-testid={`blog-post-${post.id}`}>
                <Link href={`/blog/${post.slug}`}>
                  <div className="cursor-pointer relative overflow-hidden">
                    {post.imageUrl ? (
                      <>
                        <img 
                          src={post.imageUrl} 
                          alt={post.title}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                          data-testid={`blog-image-${post.id}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white/95 backdrop-blur-sm text-foreground px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                            <i className="fas fa-book-open"></i>
                            Ler Artigo
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-muted via-muted/80 to-muted/60 flex items-center justify-center group-hover:from-primary/10 group-hover:to-secondary/10 transition-colors duration-300">
                        <i className="fas fa-newspaper text-muted-foreground text-4xl group-hover:scale-110 group-hover:text-primary transition-all duration-300"></i>
                      </div>
                    )}
                  </div>
                </Link>
                
                <CardContent className="p-6">
                  <div className="mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-2 ${
                      post.category === 'TUTORIAL' ? 'bg-blue-500/10 text-blue-500' :
                      post.category === 'TIPS' ? 'bg-green-500/10 text-green-500' :
                      post.category === 'TECHNICAL_SUPPORT' ? 'bg-orange-500/10 text-orange-500' :
                      post.category === 'NEWS' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-primary/10 text-primary'
                    }`} data-testid={`blog-category-${post.id}`}>
                      <i className={`fas ${
                        post.category === 'TUTORIAL' ? 'fa-graduation-cap' :
                        post.category === 'TIPS' ? 'fa-lightbulb' :
                        post.category === 'TECHNICAL_SUPPORT' ? 'fa-tools' :
                        post.category === 'NEWS' ? 'fa-newspaper' :
                        'fa-circle-info'
                      }`}></i>
                      {post.category === 'TUTORIAL' ? 'Tutorial' :
                       post.category === 'TIPS' ? 'Dicas' :
                       post.category === 'TECHNICAL_SUPPORT' ? 'Suporte' :
                       post.category === 'NEWS' ? 'Notícias' : 'FAQ'}
                    </span>
                  </div>
                  
                  <Link href={`/blog/${post.slug}`}>
                    <h3 className="text-xl font-semibold mb-2 cursor-pointer hover:text-primary transition-colors" data-testid={`blog-title-${post.id}`}>
                      {post.title}
                    </h3>
                  </Link>
                  
                  <p className="text-muted-foreground mb-4" data-testid={`blog-excerpt-${post.id}`}>
                    {post.excerpt ? stripHtml(post.excerpt) : stripHtml(post.content).substring(0, 120) + "..."}
                  </p>
                  
                  <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-7 h-7 ring-2 ring-primary/10">
                        <AvatarImage src={post.author.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {post.author.firstName?.[0]?.toUpperCase() || 
                           post.author.email?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium" data-testid={`blog-author-${post.id}`}>
                          {post.author.firstName || "Autor"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5" data-testid={`blog-date-${post.id}`}>
                        <i className="fas fa-clock"></i>
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString('pt-BR') : ''}
                      </span>
                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" data-testid={`blog-read-more-${post.id}`}>
                          Ler mais
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Placeholder articles when no posts exist
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Article 1 */}
            <Card className="bg-card border-border overflow-hidden">
              <div className="w-full h-48 bg-muted flex items-center justify-center">
                <i className="fas fa-cog text-muted-foreground text-3xl"></i>
              </div>
              <CardContent className="p-6">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">Tutorial</span>
                <h3 className="text-xl font-semibold mt-3 mb-2">Configuração Básica de CNC para Iniciantes</h3>
                <p className="text-muted-foreground mb-4">Guia completo para configurar sua primeira máquina CNC, desde a calibração até os primeiros cortes.</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">5 min de leitura</span>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" disabled>
                    Em breve
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Article 2 */}
            <Card className="bg-card border-border overflow-hidden">
              <div className="w-full h-48 bg-muted flex items-center justify-center">
                <i className="fas fa-tools text-muted-foreground text-3xl"></i>
              </div>
              <CardContent className="p-6">
                <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium">Dicas</span>
                <h3 className="text-xl font-semibold mt-3 mb-2">10 Ferramentas Essenciais para CNC</h3>
                <p className="text-muted-foreground mb-4">Lista definitiva de ferramentas que todo marceneiro CNC deve ter em sua oficina.</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">8 min de leitura</span>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" disabled>
                    Em breve
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Article 3 */}
            <Card className="bg-card border-border overflow-hidden">
              <div className="w-full h-48 bg-muted flex items-center justify-center">
                <i className="fas fa-tree text-muted-foreground text-3xl"></i>
              </div>
              <CardContent className="p-6">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">Material</span>
                <h3 className="text-xl font-semibold mt-3 mb-2">Guia de Madeiras para CNC</h3>
                <p className="text-muted-foreground mb-4">Conheça as melhores madeiras para cada tipo de projeto e como trabalhar com elas.</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">12 min de leitura</span>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" disabled>
                    Em breve
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {posts && posts.length > 0 && (
          <div className="text-center mt-12">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 font-semibold" data-testid="load-more-posts">
              Ver Todos os Artigos
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
