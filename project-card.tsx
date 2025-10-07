import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ProjectWithAuthor } from "@shared/schema";

interface ProjectCardProps {
  project: ProjectWithAuthor;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(false);

  const downloadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/projects/${project.id}/download`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Download registrado",
        description: "O download foi iniciado",
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
        description: "Falha ao registrar download",
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/projects/${project.id}/like`);
      return response.json();
    },
    onSuccess: (data) => {
      setLiked(data.liked);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
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

  const handleDownload = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para baixar arquivos",
        variant: "destructive",
      });
      return;
    }
    
    if (project.fileUrl) {
      downloadMutation.mutate();
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

  return (
    <Card 
      className="group project-card bg-card border-border overflow-hidden hover:shadow-2xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-1" 
      data-testid={`project-card-${project.id}`}
    >
      {/* Image Section with overlay */}
      <Link href={`/projects/${project.id}`}>
        <div className="relative cursor-pointer overflow-hidden h-56">
          {project.imageUrl ? (
            <>
              <img 
                src={project.imageUrl} 
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                data-testid={`project-image-${project.id}`}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {/* View project badge on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white/95 backdrop-blur-sm text-foreground px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                  <i className="fas fa-eye"></i>
                  Ver Projeto
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted via-muted/80 to-muted/60 flex items-center justify-center group-hover:from-primary/10 group-hover:to-secondary/10 transition-colors duration-300">
              <i className="fas fa-image text-muted-foreground text-4xl group-hover:scale-110 transition-transform duration-300"></i>
            </div>
          )}
          
          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <span 
              className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg border border-border/50" 
              data-testid={`project-category-${project.id}`}
            >
              <i className="fas fa-tag text-primary text-[10px]"></i>
              {project.category?.name || "Projeto"}
            </span>
          </div>
        </div>
      </Link>
      
      {/* Content Section */}
      <CardContent className="p-6 space-y-4">
        {/* Title */}
        <Link href={`/projects/${project.id}`}>
          <h3 
            className="text-xl font-bold cursor-pointer hover:text-primary transition-colors line-clamp-2 leading-tight" 
            data-testid={`project-title-${project.id}`}
          >
            {project.title}
          </h3>
        </Link>
        
        {/* Description */}
        <p 
          className="text-muted-foreground text-sm leading-relaxed line-clamp-2" 
          data-testid={`project-description-${project.id}`}
        >
          {project.description || "Sem descrição disponível"}
        </p>
        
        {/* Divider */}
        <div className="h-px bg-border"></div>
        
        {/* Author and Stats */}
        <div className="flex items-center justify-between">
          {/* Author Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 ring-2 ring-border hover:ring-primary transition-all">
              <AvatarImage src={project.author.profileImageUrl || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm font-semibold">
                {project.author.firstName?.[0]?.toUpperCase() || 
                 project.author.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground" data-testid={`project-author-${project.id}`}>
                {project.author.firstName || "Usuário"}
              </span>
              <span className="text-xs text-muted-foreground">
                Criador
              </span>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-1">
            {/* Like Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={`flex items-center gap-1.5 hover:bg-red-500/10 hover:text-red-500 transition-all ${
                liked ? 'text-red-500' : 'text-muted-foreground'
              }`}
              data-testid={`project-like-${project.id}`}
            >
              <i className={`fas fa-heart ${liked ? 'animate-pulse' : ''}`}></i>
              <span className="text-sm font-medium">{project.likeCount || 0}</span>
            </Button>
            
            {/* Download Count */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground">
              <i className="fas fa-download text-xs"></i>
              <span className="text-sm font-medium" data-testid={`project-downloads-${project.id}`}>
                {project.downloadCount || 0}
              </span>
            </div>
          </div>
        </div>
        
        {/* Download Button */}
        {project.fileUrl && (
          <Button
            onClick={handleDownload}
            disabled={downloadMutation.isPending}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg transition-all group/btn"
            data-testid={`project-download-${project.id}`}
          >
            <i className="fas fa-download mr-2 group-hover/btn:animate-bounce"></i>
            {downloadMutation.isPending ? "Baixando..." : "Baixar Arquivo"}
            <i className="fas fa-arrow-down ml-2 text-xs"></i>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
