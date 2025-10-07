import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { ProjectWithAuthor, Category } from "@shared/schema";

export default function EditProject() {
  const [, params] = useRoute("/projects/:id/edit");
  const projectId = params?.id;
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newImages, setNewImages] = useState<File[]>([]);

  const { data: project, isLoading: projectLoading } = useQuery<ProjectWithAuthor>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description || "");
      setCategoryId(project.categoryId || "");
    }
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/projects/${projectId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Projeto atualizado!",
        description: "Suas alterações foram salvas com sucesso",
      });
      setTimeout(() => {
        window.location.href = `/projects/${projectId}`;
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Preencha o título do projeto",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      categoryId: categoryId || undefined,
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project || (user && user.id !== project.authorId)) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <i className="fas fa-exclamation-triangle text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Acesso negado</h3>
              <p className="text-muted-foreground mb-6">Você não tem permissão para editar este projeto</p>
              <Button onClick={() => window.location.href = "/projects"} data-testid="back-to-projects">
                Ver Todos os Projetos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="edit-project-title">
            Editar Projeto
          </h1>
          <p className="text-xl text-muted-foreground">
            Atualize as informações do seu projeto
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="bg-input border-border h-32"
                  data-testid="description-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Adicionar mais fotos (opcional)
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                    data-testid="image-upload-input"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <i className="fas fa-images text-4xl text-primary mb-3"></i>
                    <p className="text-muted-foreground mb-2">
                      Clique para adicionar mais fotos
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Aceita JPG, PNG, GIF até 10MB cada
                    </p>
                  </label>
                </div>

                {newImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {newImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Nova imagem ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`remove-image-${index}`}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.location.href = `/projects/${projectId}`}
                  data-testid="cancel-button"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={updateMutation.isPending}
                  data-testid="save-button"
                >
                  {updateMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
