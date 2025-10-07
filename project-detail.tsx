import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ProjectWithAuthor, CommentWithAuthor } from "@shared/schema";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);

  const projectId = params?.id;

  const { data: project, isLoading } = useQuery<ProjectWithAuthor>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: comments } = useQuery<CommentWithAuthor[]>({
    queryKey: ["/api/projects", projectId, "comments"],
    enabled: !!projectId,
  });

  const { data: projectImages } = useQuery<any[]>({
    queryKey: ["/api/projects", projectId, "images"],
    enabled: !!projectId,
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/projects/${projectId}/download`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "Download iniciado",
        description: "O arquivo foi baixado com sucesso",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Login necessário",
          description: "Faça login para baixar arquivos",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao baixar arquivo",
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/like`);
      return response.json();
    },
    onSuccess: (data) => {
      setLiked(data.liked);
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: data.liked ? "Projeto curtido!" : "Curtida removida",
        description: `${data.count} curtidas`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Login necessário",
          description: "Faça login para curtir projetos",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao curtir projeto",
        variant: "destructive",
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/comments`, { content });
      return response.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "comments"] });
      toast({
        title: "Comentário adicionado!",
        description: "Seu comentário foi publicado",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Login necessário",
          description: "Faça login para comentar",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao adicionar comentário",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/projects/${projectId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Projeto excluído!",
        description: "O projeto foi removido com sucesso",
      });
      setTimeout(() => {
        window.location.href = "/projects";
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao excluir projeto",
        variant: "destructive",
      });
    },
  });

  const handleDownload = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para baixar arquivos",
        variant: "destructive",
      });
      return;
    }
    
    if (project?.fileUrl) {
      downloadMutation.mutate();
      // Trigger actual download
      const link = document.createElement('a');
      link.href = project.fileUrl;
      link.download = project.fileName || 'arquivo';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleLike = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para curtir projetos",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para comentar",
        variant: "destructive",
      });
      return;
    }
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment.trim());
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.")) {
      deleteMutation.mutate();
    }
  };

  const handleEdit = () => {
    window.location.href = `/projects/${projectId}/edit`;
  };

  const isAuthor = user && project && user.id === project.authorId;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p>Carregando projeto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <i className="fas fa-exclamation-triangle text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Projeto não encontrado</h3>
              <p className="text-muted-foreground mb-6">O projeto que você está procurando não existe ou foi removido</p>
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
        {/* Project Header */}
        <Card className="bg-card border-border mb-8">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Project Image */}
              <div>
                {project.imageUrl ? (
                  <div className="space-y-4">
                    <img 
                      src={project.imageUrl} 
                      alt={project.title}
                      className="w-full h-64 lg:h-96 object-cover rounded-lg"
                      data-testid="project-detail-image"
                    />
                    {projectImages && projectImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {projectImages.map((img, index) => (
                          <img
                            key={img.id}
                            src={img.imageUrl}
                            alt={img.caption || `Imagem ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            data-testid={`project-additional-image-${index}`}
                            onClick={() => window.open(img.imageUrl, '_blank')}
                            title={img.caption || ''}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-64 lg:h-96 bg-muted rounded-lg flex items-center justify-center">
                    <i className="fas fa-image text-muted-foreground text-6xl"></i>
                  </div>
                )}
              </div>

              {/* Project Info */}
              <div>
                <div className="mb-4">
                  <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2">
                    <i className="fas fa-tag text-xs"></i>
                    {project.category?.name || "Projeto"}
                  </span>
                </div>

                <h1 className="text-3xl font-bold mb-4" data-testid="project-detail-title">
                  {project.title}
                </h1>

                <p className="text-muted-foreground mb-6" data-testid="project-detail-description">
                  {project.description || "Projeto compartilhado pela comunidade"}
                </p>

                {/* Author Info */}
                <div className="flex items-center space-x-3 mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                  <Avatar className="w-14 h-14 ring-2 ring-primary/20">
                    <AvatarImage src={project.author.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                      {project.author.firstName?.[0]?.toUpperCase() || 
                       project.author.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg flex items-center gap-2" data-testid="project-author-name">
                      <i className="fas fa-user text-primary text-sm"></i>
                      {project.author.firstName ? `${project.author.firstName} ${project.author.lastName || ''}`.trim() : "Usuário"}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <i className="fas fa-calendar text-xs"></i>
                      {project.createdAt ? `Publicado em ${new Date(project.createdAt).toLocaleDateString('pt-BR')}` : ''}
                    </p>
                  </div>
                </div>

                {/* Project Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center space-x-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20" data-testid="project-likes">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                      <i className="fas fa-heart text-red-500"></i>
                    </div>
                    <div>
                      <div className="font-bold text-lg text-red-500">{project.likeCount || 0}</div>
                      <div className="text-xs text-muted-foreground">Curtidas</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-primary/10 rounded-lg border border-primary/20" data-testid="project-downloads">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <i className="fas fa-download text-primary"></i>
                    </div>
                    <div>
                      <div className="font-bold text-lg text-primary">{project.downloadCount || 0}</div>
                      <div className="text-xs text-muted-foreground">Downloads</div>
                    </div>
                  </div>
                  {project.fileName && (
                    <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg border border-border col-span-2 md:col-span-1" data-testid="project-file-info">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <i className="fas fa-file text-muted-foreground"></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-muted-foreground">Arquivo</div>
                        <div className="text-sm font-medium truncate">{project.fileName}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleLike}
                    disabled={likeMutation.isPending}
                    variant={liked ? "default" : "outline"}
                    className="flex-1 min-w-[120px]"
                    data-testid="like-button"
                  >
                    <i className={`fas fa-heart mr-2 ${liked ? 'text-red-500' : ''}`}></i>
                    {liked ? 'Curtido' : 'Curtir'}
                  </Button>

                  {project.fileUrl && (
                    <Button
                      onClick={handleDownload}
                      disabled={downloadMutation.isPending}
                      className="flex-1 min-w-[120px] bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                      data-testid="download-button"
                    >
                      {downloadMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Baixando...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-download mr-2"></i>
                          Baixar Arquivo
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Author Actions */}
                {isAuthor && (
                  <div className="flex gap-3 mt-4">
                    <Button
                      onClick={handleEdit}
                      variant="outline"
                      className="flex-1"
                      data-testid="edit-button"
                    >
                      <i className="fas fa-edit mr-2"></i>
                      Editar
                    </Button>
                    <Button
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      variant="destructive"
                      className="flex-1"
                      data-testid="delete-button"
                    >
                      {deleteMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Excluindo...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-trash mr-2"></i>
                          Excluir
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="bg-card border-border">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3" data-testid="comments-title">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <i className="fas fa-comments text-primary text-xl"></i>
              </div>
              <span>Comentários ({comments?.length || 0})</span>
            </h3>

            {/* Add Comment Form */}
            {isAuthenticated ? (
              <form onSubmit={handleComment} className="mb-8">
                <div className="flex space-x-4">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escreva seu comentário..."
                      className="bg-input border-border"
                      data-testid="comment-input"
                    />
                    <Button
                      type="submit"
                      disabled={commentMutation.isPending || !newComment.trim()}
                      className="mt-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                      data-testid="comment-submit"
                    >
                      {commentMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Enviando...
                        </>
                      ) : (
                        "Enviar Comentário"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="bg-muted rounded-lg p-6 mb-8 text-center">
                <p className="text-muted-foreground mb-4">Faça login para deixar seu comentário</p>
                <Button 
                  onClick={() => window.location.href = '/api/login'}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  data-testid="login-to-comment"
                >
                  Fazer Login
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-4" data-testid={`comment-${comment.id}`}>
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={comment.author.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {comment.author.firstName?.[0]?.toUpperCase() || 
                         comment.author.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium" data-testid={`comment-author-${comment.id}`}>
                            {comment.author.firstName || "Usuário"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('pt-BR') : ''}
                          </span>
                        </div>
                        <p className="text-foreground" data-testid={`comment-content-${comment.id}`}>
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <i className="fas fa-comments text-4xl mb-4"></i>
                  <p>Seja o primeiro a comentar neste projeto!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}