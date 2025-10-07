import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { resizeImage, formatFileSize, getImageDimensions } from "@/lib/imageResizer";
import type { Category, ProjectWithAuthor } from "@shared/schema";

export default function Files() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<File[]>([]);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: recentFiles } = useQuery<ProjectWithAuthor[]>({
    queryKey: ["/api/projects"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Projeto publicado!",
        description: "Seu projeto foi compartilhado com a comunidade",
      });
      
      // Reset form
      setSelectedFile(null);
      setTitle("");
      setDescription("");
      setCategoryId("");
      setImages([]);
      
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Login necessário",
          description: "Faça login para compartilhar projetos",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Erro ao publicar projeto",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para acessar esta página",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !title.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e selecione um arquivo",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    if (categoryId) {
      formData.append("categoryId", categoryId);
    }

    // Add additional images
    images.forEach((image, index) => {
      formData.append(`image_${index}`, image);
    });

    uploadMutation.mutate(formData);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    toast({
      title: "Processando imagens...",
      description: "Redimensionando e otimizando as imagens",
    });

    try {
      // Redimensionar todas as imagens automaticamente
      const resizedFiles = await Promise.all(
        files.map(async (file) => {
          // Verificar se é uma imagem
          if (!file.type.startsWith('image/')) {
            return file;
          }

          try {
            const dimensions = await getImageDimensions(file);
            const originalSize = formatFileSize(file.size);

            // Redimensionar se necessário
            if (dimensions.width > 1920 || dimensions.height > 1920) {
              const resized = await resizeImage(file, {
                maxWidth: 1920,
                maxHeight: 1920,
                quality: 0.85,
              });

              const newSize = formatFileSize(resized.size);
              const reduction = Math.round((1 - resized.size / file.size) * 100);

              console.log(`Imagem redimensionada: ${file.name} - Redução de ${reduction}%`);
              return resized;
            }

            return file;
          } catch (error) {
            console.error(`Erro ao processar ${file.name}:`, error);
            return file;
          }
        })
      );

      setImages(prev => [...prev, ...resizedFiles]);
      
      toast({
        title: "Imagens adicionadas!",
        description: `${files.length} imagem(s) processada(s) e otimizada(s)`,
      });
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      toast({
        title: "Erro ao processar imagens",
        description: "Algumas imagens podem não ter sido otimizadas",
        variant: "destructive",
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <i className="fas fa-file-alt text-5xl text-primary mb-4"></i>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="files-page-title">
            Central de Arquivos
          </h1>
          <p className="text-xl text-muted-foreground">
            Compartilhe e baixe arquivos DXF, STL e projetos da comunidade
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Upload Section */}
          <div className="bg-card rounded-xl p-8 border border-border">
            <h3 className="text-2xl font-semibold mb-6 flex items-center" data-testid="upload-section-title">
              <i className="fas fa-cloud-upload-alt text-primary mr-3"></i>
              Compartilhar Arquivo
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <FileUpload
                onFileSelect={setSelectedFile}
                disabled={uploadMutation.isPending}
              />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" data-testid="title-label">
                    Título do Projeto *
                  </label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Mesa de Centro Minimalista"
                    className="bg-input border-border"
                    required
                    data-testid="title-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" data-testid="category-label">
                    Categoria
                  </label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="bg-input border-border" data-testid="category-select">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" data-testid="description-label">
                    Descrição
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva seu projeto, materiais utilizados, dificuldade..."
                    className="bg-input border-border h-24"
                    data-testid="description-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fotos Adicionais (opcional)
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                      id="additional-images"
                      data-testid="additional-images-input"
                    />
                    <label htmlFor="additional-images" className="cursor-pointer block">
                      <i className="fas fa-images text-3xl text-primary mb-2"></i>
                      <p className="text-sm text-muted-foreground">
                        Clique para adicionar fotos
                      </p>
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {images.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                            data-testid={`preview-image-${index}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`remove-image-${index}`}
                          >
                            ×
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 rounded-b-lg">
                            {file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground py-3 font-semibold"
                  disabled={uploadMutation.isPending || !selectedFile || !title.trim()}
                  data-testid="publish-button"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Publicando...
                    </>
                  ) : (
                    "Publicar Projeto"
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Categories & Recent Files */}
          <div className="space-y-8">
            {/* Categories */}
            <Card className="bg-background border-border">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4" data-testid="categories-title">Categorias Populares</h3>
                <div className="grid grid-cols-2 gap-3">
                  {categories?.slice(0, 6).map((category) => (
                    <Button
                      key={category.id}
                      variant="outline"
                      className="text-left p-3 bg-muted hover:bg-muted/80 transition-colors justify-between"
                      data-testid={`category-${category.slug}`}
                    >
                      <span className="font-medium">{category.name}</span>
                      <span className="text-sm text-muted-foreground">--</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Downloads */}
            <Card className="bg-background border-border">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4" data-testid="recent-downloads-title">Arquivos Recentes</h3>
                <div className="space-y-3">
                  {recentFiles?.slice(0, 5).map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                      data-testid={`recent-file-${file.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <i className={`fas ${
                          file.fileType?.includes('image') ? 'fa-image text-blue-500' :
                          file.fileName?.endsWith('.dxf') ? 'fa-file-code text-primary' :
                          file.fileName?.endsWith('.stl') ? 'fa-cube text-secondary' :
                          file.fileName?.endsWith('.pdf') ? 'fa-file-pdf text-red-500' :
                          'fa-file text-muted-foreground'
                        }`}></i>
                        <div>
                          <p className="font-medium">{file.fileName || file.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Por @{file.author.firstName || "usuário"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                        data-testid={`download-${file.id}`}
                      >
                        <i className="fas fa-download"></i>
                      </Button>
                    </div>
                  )) || (
                    <div className="text-center text-muted-foreground py-4">
                      <i className="fas fa-folder-open text-2xl mb-2"></i>
                      <p>Nenhum arquivo encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
