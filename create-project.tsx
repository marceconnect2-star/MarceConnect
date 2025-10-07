import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useImageUpload } from "@/hooks/useImageUpload";
import type { Category } from "@shared/schema";
import { FileUpload } from "@/components/file-upload";

interface UploadedImage {
  url: string;
  caption: string;
  file?: File;
}

interface VideoEntry {
  url: string;
  title: string;
  description: string;
}

export default function CreateProject() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Hook para upload de imagens com redimensionamento automático
  const { uploadImage, uploading } = useImageUpload({
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para criar projetos",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  // create-project.tsx (Corrigido com console.error para debug)

const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  try {
    const file = files[0];
    // Upload com redimensionamento automático
    const url = await uploadImage(file); 
    setImages([...images, { url, caption: "", file }]);
    toast({
      title: "Imagem adicionada!",
      description: "Imagem redimensionada e otimizada automaticamente",
    });
  } catch (error) {
    // 🚨 ADICIONE ESTA LINHA PARA SABER O QUE ESTÁ FALHANDO
    console.error("Erro durante o upload/redimensionamento da imagem principal:", error); 
    toast({
      title: "Falha ao adicionar imagem",
      description: "Verifique o formato da imagem ou tente outra foto.",
      variant: "destructive",
    });
  }
};

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleImageCaptionChange = (index: number, caption: string) => {
    const newImages = [...images];
    newImages[index].caption = caption;
    setImages(newImages);
  };

  const handleAddVideo = () => {
    setVideos([...videos, { url: "", title: "", description: "" }]);
  };

  const handleRemoveVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const handleVideoChange = (index: number, field: keyof VideoEntry, value: string) => {
    const newVideos = [...videos];
    newVideos[index][field] = value;
    setVideos(newVideos);
  };

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const response = await apiRequest("POST", "/api/projects/create", projectData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Projeto criado!",
        description: "Seu projeto foi publicado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation(`/projects/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Erro ao criar projeto",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, insira um título para o projeto",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload main file if exists
      let fileUrl = "";
      let fileName = "";
      let fileType = "";
      let fileSize = 0;

      if (mainFile) {
        const formData = new FormData();
        formData.append("file", mainFile);
        
        const fileResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!fileResponse.ok) {
          throw new Error("Falha no upload do arquivo principal");
        }

        const fileData = await fileResponse.json();
        fileUrl = fileData.url;
        fileName = fileData.filename;
        fileType = mainFile.type;
        fileSize = mainFile.size;
      }

      // Prepare project data
      const projectData = {
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId || undefined,
        fileUrl,
        fileName,
        fileType,
        fileSize,
        images: images.map((img, index) => ({
          imageUrl: img.url,
          caption: img.caption,
          order: index,
        })),
        videos: videos.filter(v => v.url.trim()).map((video, index) => ({
          videoUrl: video.url.trim(),
          title: video.title.trim(),
          description: video.description.trim(),
          order: index,
        })),
      };

      createProjectMutation.mutate(projectData);
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload dos arquivos",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
            <i className="fas fa-plus-circle text-3xl text-primary"></i>
          </div>
          <h1 className="text-3xl font-bold mb-2">Criar Novo Projeto</h1>
          <p className="text-muted-foreground">
            Compartilhe seu projeto CNC com a comunidade
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-info-circle text-primary mr-2"></i>
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="flex items-center">
                  <i className="fas fa-heading text-muted-foreground mr-2 text-sm"></i>
                  Título do Projeto *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Mesa de corte CNC"
                  className="mt-1"
                  data-testid="input-title"
                />
              </div>

              <div>
                <Label htmlFor="category" className="flex items-center">
                  <i className="fas fa-tag text-muted-foreground mr-2 text-sm"></i>
                  Categoria
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="mt-1" data-testid="select-category">
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
                <Label htmlFor="description" className="flex items-center">
                  <i className="fas fa-align-left text-muted-foreground mr-2 text-sm"></i>
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva seu projeto, materiais usados, dificuldades encontradas..."
                  className="mt-1"
                  rows={6}
                  data-testid="textarea-description"
                />
              </div>
            </CardContent>
          </Card>

          {/* Main File */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-file-upload text-primary mr-2"></i>
                Arquivo do Projeto (opcional)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Faça upload do arquivo CAD, PDF ou outro arquivo técnico
              </p>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={(file) => setMainFile(file)}
                accept={{
                  'application/octet-stream': ['.dxf', '.stl'],
                  'application/pdf': ['.pdf'],
                  'application/zip': ['.zip'],
                  'application/stp': ['.step', '.stp'],
                  'text/plain': ['.nc', '.gcode'],
                }}
              />
              {mainFile && (
                <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-file text-primary text-xl"></i>
                    <div>
                      <p className="font-medium">{mainFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(mainFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setMainFile(null)}
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-images text-primary mr-2"></i>
                Fotos do Projeto
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Adicione fotos para mostrar seu projeto
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {images.map((image, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted space-y-3">
                  <div className="flex items-start justify-between">
  <img
    // Usar o URL que veio do backend
    src={image.url}
    alt={`Imagem ${index + 1}`}
    className="w-32 h-32 object-cover rounded"
    
    // 🚨 ADICIONE ISTO PARA DEPURAR
    onError={(e) => {
      console.error(
        `[ERRO NO CARREGAMENTO DA IMAGEM] Falha ao carregar no src: ${image.url}`
      );
      // Opcional: Altera a fonte para uma imagem de fallback visível
      e.currentTarget.src = 'https://via.placeholder.com/128?text=FALHA';
    }}
  />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveImage(index)}
                      data-testid={`button-remove-image-${index}`}
                    >
                      <i className="fas fa-trash text-destructive"></i>
                    </Button>
                  </div>
                  <div>
                    <Label>Legenda (opcional)</Label>
                    <Input
                      value={image.caption}
                      onChange={(e) => handleImageCaptionChange(index, e.target.value)}
                      placeholder="Adicione uma legenda para a imagem"
                      className="mt-1"
                      data-testid={`input-image-caption-${index}`}
                    />
                  </div>
                </div>
              ))}

              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAddImage}
                  className="hidden"
                  id="image-upload"
                  data-testid="input-add-image"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={uploading}
                  onClick={() => document.getElementById('image-upload')?.click()}
                  data-testid="button-add-image"
                >
                  {uploading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus mr-2"></i>
                      Adicionar Foto
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Videos */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-video text-primary mr-2"></i>
                Vídeos do Projeto
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Adicione links de vídeos do YouTube ou outras plataformas
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {videos.map((video, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium">Vídeo {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVideo(index)}
                      data-testid={`button-remove-video-${index}`}
                    >
                      <i className="fas fa-trash text-destructive"></i>
                    </Button>
                  </div>
                  <div>
                    <Label>URL do Vídeo *</Label>
                    <Input
                      value={video.url}
                      onChange={(e) => handleVideoChange(index, "url", e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="mt-1"
                      data-testid={`input-video-url-${index}`}
                    />
                  </div>
                  <div>
                    <Label>Título (opcional)</Label>
                    <Input
                      value={video.title}
                      onChange={(e) => handleVideoChange(index, "title", e.target.value)}
                      placeholder="Título do vídeo"
                      className="mt-1"
                      data-testid={`input-video-title-${index}`}
                    />
                  </div>
                  <div>
                    <Label>Descrição (opcional)</Label>
                    <Input
                      value={video.description}
                      onChange={(e) => handleVideoChange(index, "description", e.target.value)}
                      placeholder="Breve descrição"
                      className="mt-1"
                      data-testid={`input-video-description-${index}`}
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleAddVideo}
                data-testid="button-add-video"
              >
                <i className="fas fa-plus mr-2"></i>
                Adicionar Vídeo
              </Button>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/projects")}
              className="flex-1"
              data-testid="button-cancel"
            >
              <i className="fas fa-times mr-2"></i>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isUploading || uploading || createProjectMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90"
              data-testid="button-submit"
            >
              {isUploading || uploading || createProjectMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Publicando...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Publicar Projeto
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
