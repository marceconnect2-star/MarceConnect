import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import type { ProjectWithAuthor, Category } from "@shared/schema";
import { FolderOpen } from "lucide-react";


export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { isAuthenticated } = useAuth();

  const { data: projects, isLoading } = useQuery<ProjectWithAuthor[]>({
    queryKey: ["/api/projects", selectedCategory === "all" ? undefined : selectedCategory],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const filteredProjects = projects?.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Professional Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-b border-border">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <div className="text-center space-y-6">
            {/* Icon with gradient background */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-xl shadow-primary/20 mb-4">
  <FolderOpen className="w-10 h-10 text-white" />
</div>
            
            {/* Title and description */}
            <div className="space-y-4">
              <h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-foreground to-secondary bg-clip-text text-transparent leading-tight"
                data-testid="projects-page-title"
              >
                Galeria de Projetos
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Explore, inspire-se e compartilhe projetos incríveis da comunidade brasileira de marcenaria CNC
              </p>
            </div>

            {/* Stats badges */}
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm">
                <i className="fas fa-layer-group text-primary"></i>
                <span className="text-sm font-medium">
                  {projects?.length || 0} Projetos
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm">
                <i className="fas fa-heart text-red-500"></i>
                <span className="text-sm font-medium">
                  {projects?.reduce((acc, p) => acc + (p.likeCount || 0), 0) || 0} Curtidas
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm">
                <i className="fas fa-download text-secondary"></i>
                <span className="text-sm font-medium">
                  {projects?.reduce((acc, p) => acc + (p.downloadCount || 0), 0) || 0} Downloads
                </span>
              </div>
            </div>

            {/* CTA Button */}
            {isAuthenticated && (
              <div className="pt-6">
                <Link href="/create-project">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:scale-105 transition-all duration-300 text-white font-semibold px-8 py-6 text-lg group"
                    data-testid="button-create-project"
                  >
                    <i className="fas fa-plus-circle mr-3 group-hover:rotate-90 transition-transform duration-300"></i>
                    Criar Novo Projeto
                    <i className="fas fa-arrow-right ml-3 group-hover:translate-x-1 transition-transform duration-300"></i>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Professional Filters Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-xl mb-10 hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <i className="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors"></i>
                  <Input
                    type="text"
                    placeholder="Buscar por título, descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-background border-border pl-12 pr-4 h-12 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    data-testid="search-input"
                  />
                </div>
              </div>
              
              {/* Category Select */}
              <div className="md:w-64">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-background border-border h-12 hover:border-primary transition-colors" data-testid="category-select">
                    <i className="fas fa-filter mr-2 text-muted-foreground"></i>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center">
                        <i className="fas fa-grid mr-2"></i>
                        Todas as categorias
                      </span>
                    </SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Clear Filters Button */}
              {(searchTerm || selectedCategory !== "all") && (
                <Button
                  variant="outline"
                  className="h-12 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                  data-testid="clear-filters"
                >
                  <i className="fas fa-filter-circle-xmark mr-2"></i>
                  Limpar Filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Summary with refined design */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
            <p className="text-lg font-medium text-foreground" data-testid="results-summary">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <i className="fas fa-spinner fa-spin text-primary"></i>
                  Carregando projetos...
                </span>
              ) : filteredProjects.length === 0 ? (
                "Nenhum projeto encontrado"
              ) : (
                <span>
                  <span className="text-2xl font-bold text-primary">{filteredProjects.length}</span>
                  <span className="text-muted-foreground ml-2">
                    projeto{filteredProjects.length !== 1 ? 's' : ''} encontrado{filteredProjects.length !== 1 ? 's' : ''}
                  </span>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Projects Grid with enhanced cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card 
                key={i} 
                className="bg-card border-border overflow-hidden" 
                data-testid={`skeleton-${i}`}
              >
                <div className="w-full h-56 bg-gradient-to-br from-muted to-muted/50 animate-pulse"></div>
                <CardContent className="p-6 space-y-4">
                  <div className="h-6 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
                  <div className="flex justify-between pt-4">
                    <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <Card className="bg-card/50 backdrop-blur-sm border-border shadow-xl">
            <CardContent className="p-16 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted/50 mb-4">
                <i className="fas fa-folder-open text-5xl text-muted-foreground"></i>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Nenhum projeto encontrado</h3>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  {searchTerm || selectedCategory !== "all" ? 
                    "Tente ajustar os filtros de busca para encontrar o que procura" : 
                    "Seja o primeiro a compartilhar um projeto incrível com a comunidade"
                  }
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                {(searchTerm || selectedCategory !== "all") && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="group"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                    }}
                    data-testid="clear-filters-empty"
                  >
                    <i className="fas fa-rotate-left mr-2 group-hover:rotate-180 transition-transform duration-300"></i>
                    Limpar Filtros
                  </Button>
                )}
                {isAuthenticated && (
                  <Link href="/create-project">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-primary to-secondary hover:shadow-xl transition-all group"
                    >
                      <i className="fas fa-cloud-arrow-up mr-2 group-hover:-translate-y-1 transition-transform"></i>
                      Compartilhar Projeto
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
