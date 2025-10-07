import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectWithAuthor } from "@shared/schema";

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: stats } = useQuery<{
    totalUsers: number;
    totalProjects: number;
    totalDownloads: number;
    totalLikes: number;
    totalBlogPosts: number;
  }>({
    queryKey: ["/api/statistics"],
  });

  const { data: featuredProjects } = useQuery<ProjectWithAuthor[]>({
    queryKey: ["/api/projects"],
    select: (projects) => projects?.slice(0, 3) || [],
  });

  const { data: allPartners, isLoading: partnersLoading, isError: partnersError } = useQuery<any[]>({
    queryKey: ["/api/cnc-brands"],
  });

  const partners = allPartners?.filter((partner) => partner.isSponsor) || [];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Modern Minimal Navigation */}
      <nav className="bg-background/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="MarceConnect" 
                className="w-14 h-14 object-contain rounded-lg hover:scale-110 transition-transform duration-300"
              />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">MarceConnect</h1>
                <p className="text-xs text-muted-foreground">Conectando Marceneiros</p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#inicio" className="text-sm font-medium hover:text-primary transition-colors relative group">
                Início
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </a>
              <a href="#funcionalidades" className="text-sm font-medium hover:text-primary transition-colors relative group">
                Funcionalidades
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </a>
              <a href="#como-funciona" className="text-sm font-medium hover:text-primary transition-colors relative group">
                Como Funciona
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </a>
              <a href="#parceiros" className="text-sm font-medium hover:text-primary transition-colors relative group">
                Parceiros
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
              </a>
            </div>

            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost"
                onClick={() => window.location.href = '/login'}
                className="hover:scale-105 transition-transform"
                data-testid="button-login"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Entrar
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 hover:scale-105 transition-all shadow-lg hover:shadow-xl"
                onClick={() => window.location.href = '/login'}
              >
                <i className="fas fa-rocket mr-2"></i>
                Começar Agora
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Parallax Effect */}
      <section id="inicio" className="relative py-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 transition-transform"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        ></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.05), transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 107, 0, 0.05), transparent 50%)'
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full mb-8 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium text-primary">✨ Conectando marceneiros de todo o Brasil</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Transforme suas ideias em{" "}
              <span className="block mt-2 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient">
                realidade digital
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              A plataforma que conecta marceneiros, técnicos e empresas. Compartilhe projetos e faça parte da maior comunidade CNC do Brasil.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-2xl transition-all hover:scale-105 group"
                onClick={() => window.location.href = '/login'}
                data-testid="button-get-started"
              >
                <i className="fas fa-sparkles mr-2"></i>
                Começar Gratuitamente
                <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg rounded-full hover:scale-105 transition-all border-2"
                onClick={() => window.location.href = '/login'}
                data-testid="button-explore-projects"
              >
                <i className="fas fa-compass mr-2"></i>
                Explorar Projetos
              </Button>
            </div>

            <div className="mt-20 grid grid-cols-3 gap-8 max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="group cursor-default">
                <i className="fas fa-folder-open text-3xl text-primary/60 mb-3 group-hover:scale-110 transition-transform inline-block"></i>
                <div className="text-4xl font-bold text-primary mb-1">{stats?.totalProjects || 0}+</div>
                <div className="text-sm text-muted-foreground">Projetos</div>
              </div>
              <div className="group cursor-default">
                <i className="fas fa-users text-3xl text-primary/60 mb-3 group-hover:scale-110 transition-transform inline-block"></i>
                <div className="text-4xl font-bold text-primary mb-1">{stats?.totalUsers || 0}+</div>
                <div className="text-sm text-muted-foreground">Membros</div>
              </div>
              <div className="group cursor-default">
                <i className="fas fa-cloud-download-alt text-3xl text-primary/60 mb-3 group-hover:scale-110 transition-transform inline-block"></i>
                <div className="text-4xl font-bold text-primary mb-1">{stats?.totalDownloads || 0}+</div>
                <div className="text-sm text-muted-foreground">Downloads</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-24 bg-card/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <i className="fas fa-star text-primary"></i>
              <span className="text-sm font-medium text-primary">Recursos Poderosos</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Tudo que você precisa</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas profissionais para sua marcenaria digital
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card 
              className="bg-background border-border/50 hover:border-primary/50 transition-all group hover:scale-105 hover:shadow-2xl cursor-pointer"
              onClick={() => window.location.href = '/login'}
            >
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <i className="fas fa-boxes text-3xl text-primary"></i>
                </div>
                <h3 className="text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">Biblioteca de Projetos</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Acesse milhares de projetos DXF e STL compartilhados pela comunidade. Baixe e use em suas criações.
                </p>
                <div className="flex items-center text-sm text-primary font-medium group-hover:gap-2 transition-all">
                  <span>Explorar biblioteca</span>
                  <i className="fas fa-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-background border-border/50 hover:border-secondary/50 transition-all group hover:scale-105 hover:shadow-2xl cursor-pointer"
              onClick={() => window.location.href = '/login'}
            >
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <i className="fas fa-user-friends text-3xl text-secondary"></i>
                </div>
                <h3 className="text-2xl font-semibold mb-3 group-hover:text-secondary transition-colors">Rede de Profissionais</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Conecte-se com técnicos especializados, empresas e entusiastas de CNC de todo o Brasil.
                </p>
                <div className="flex items-center text-sm text-secondary font-medium group-hover:gap-2 transition-all">
                  <span>Conhecer técnicos</span>
                  <i className="fas fa-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-background border-border/50 hover:border-primary/50 transition-all group hover:scale-105 hover:shadow-2xl cursor-pointer"
              onClick={() => window.location.href = '/login'}
            >
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <i className="fas fa-lightbulb text-3xl text-primary"></i>
                </div>
                <h3 className="text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">Aprenda e Evolua</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Tutoriais, dicas e conhecimento compartilhado pelos melhores profissionais da área.
                </p>
                <div className="flex items-center text-sm text-primary font-medium group-hover:gap-2 transition-all">
                  <span>Acessar conteúdo</span>
                  <i className="fas fa-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="como-funciona" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-secondary/10 px-4 py-2 rounded-full mb-6">
              <i className="fas fa-route text-secondary"></i>
              <span className="text-sm font-medium text-secondary">Simples e Rápido</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Como funciona</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Em apenas 3 passos você estará conectado à maior comunidade CNC do Brasil
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary opacity-20"></div>

            <div className="relative text-center group">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/50 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white text-sm font-bold group-hover:scale-125 transition-transform">
                  <i className="fas fa-check"></i>
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-3">Crie sua conta</h3>
              <p className="text-muted-foreground leading-relaxed">
                Cadastro rápido e gratuito. Comece a fazer parte da comunidade em segundos.
              </p>
            </div>

            <div className="relative text-center group">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary to-secondary/50 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <span className="text-3xl font-bold text-white">2</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold group-hover:scale-125 transition-transform">
                  <i className="fas fa-check"></i>
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-3">Explore e conecte</h3>
              <p className="text-muted-foreground leading-relaxed">
                Navegue por projetos, conecte-se com profissionais e encontre inspiração.
              </p>
            </div>

            <div className="relative text-center group">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/50 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <span className="text-3xl font-bold text-white">3</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white text-sm font-bold group-hover:scale-125 transition-transform">
                  <i className="fas fa-rocket"></i>
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-3">Crie e compartilhe</h3>
              <p className="text-muted-foreground leading-relaxed">
                Publique seus projetos, ajude outros makers e construa sua reputação.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      {featuredProjects && featuredProjects.length > 0 && (
        <section id="projetos" className="py-24 bg-card/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                <i className="fas fa-fire text-primary"></i>
                <span className="text-sm font-medium text-primary">Destaques da Comunidade</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Projetos em destaque</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Veja o que nossa comunidade está criando
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {featuredProjects.map((project) => (
                <Card 
                  key={project.id} 
                  className="bg-background border-border hover:border-primary/50 transition-all hover:scale-105 hover:shadow-2xl group cursor-pointer overflow-hidden h-full"
                  onClick={() => window.location.href = '/login'}
                >
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                        <i className="fas fa-cube text-6xl text-primary/40"></i>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {project.description || "Projeto da comunidade MarceConnect"}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <i className="fas fa-heart text-xs"></i>
                          {project.likeCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="fas fa-download text-xs"></i>
                          {project.downloadCount || 0}
                        </span>
                      </div>
                      <span className="text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        Ver projeto
                        <i className="fas fa-arrow-right text-xs"></i>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full px-8 hover:scale-105 transition-all"
                onClick={() => window.location.href = '/login'}
                data-testid="button-view-all-projects"
              >
                Ver todos os projetos
                <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Partners Section */}
      <section id="parceiros" className="py-32 bg-gradient-to-b from-background via-card/20 to-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <i className="fas fa-handshake text-primary"></i>
              <span className="text-sm font-medium text-primary">Parcerias de Qualidade</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Nossos Parceiros</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Empresas e marcas que confiam e apoiam o MarceConnect
            </p>
          </div>

          {/* Loading State */}
          {partnersLoading && (
            <div className="text-center py-20">
              <div className="relative inline-block">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <i className="fas fa-handshake absolute inset-0 m-auto text-2xl text-primary animate-pulse"></i>
              </div>
              <p className="text-muted-foreground mt-6 text-lg">Carregando parceiros...</p>
            </div>
          )}

          {/* Error State */}
          {partnersError && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-2xl text-destructive"></i>
              </div>
              <p className="text-destructive text-lg">Erro ao carregar parceiros. Tente novamente mais tarde.</p>
            </div>
          )}

          {/* Partners Grid */}
          {!partnersLoading && !partnersError && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {partners && partners.length > 0 ? (
                partners.map((partner) => (
                  <a
                    key={partner.id}
                    href={partner.website || '#'}
                    target={partner.website ? "_blank" : undefined}
                    rel={partner.website ? "noopener noreferrer" : undefined}
                    className={`block ${!partner.website ? 'cursor-default' : ''}`}
                    data-testid={`link-partner-${partner.id}`}
                  >
                    <Card 
                      className="bg-card border-border hover:border-primary/50 hover:shadow-2xl transition-all duration-300 group h-full overflow-hidden hover:scale-105"
                    >
                      <CardContent className="p-8 flex flex-col items-center justify-center min-h-[200px] relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        {partner.logoUrl ? (
                          <div className="w-full h-28 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 relative z-10">
                            <img 
                              src={partner.logoUrl} 
                              alt={partner.name}
                              className="max-w-full max-h-full object-contain rounded-lg"
                              style={{ maxWidth: '200px', maxHeight: '112px' }}
                              data-testid={`partner-logo-${partner.id}`}
                            />
                          </div>
                        ) : (
                          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300 relative z-10">
                            <i className="fas fa-handshake text-primary"></i>
                          </div>
                        )}
                        <h3 className="font-bold text-center text-lg relative z-10 group-hover:text-primary transition-colors" data-testid={`partner-name-${partner.id}`}>
                          {partner.name}
                        </h3>
                        {partner.description && (
                          <p className="text-sm text-muted-foreground mt-3 text-center line-clamp-2 relative z-10">{partner.description}</p>
                        )}
                        {partner.website && (
                          <span className="text-sm text-primary mt-4 flex items-center gap-2 font-medium relative z-10 group-hover:gap-3 transition-all">
                            Visitar site
                            <i className="fas fa-external-link-alt text-xs"></i>
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  </a>
                ))
              ) : (
                <div className="col-span-full text-center py-20">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-handshake text-4xl text-muted-foreground"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Nenhum parceiro cadastrado</h3>
                  <p className="text-muted-foreground text-lg">Em breve, novos parceiros serão adicionados!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Technicians Section */}
      <section id="tecnicos" className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-secondary/10 px-4 py-2 rounded-full mb-6">
                <i className="fas fa-tools text-secondary"></i>
                <span className="text-sm font-medium text-secondary">Suporte Especializado</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Encontre técnicos especializados
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Acesso direto aos melhores profissionais de manutenção e suporte CNC de todo o Brasil. Filtro por localização, marca e especialidade.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="fas fa-map-marker-alt text-primary"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Busca por localização</h4>
                    <p className="text-muted-foreground text-sm">Encontre técnicos em todo o Brasil, organizados por estado e cidade</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="fas fa-certificate text-secondary"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Especialistas certificados</h4>
                    <p className="text-muted-foreground text-sm">Técnicos associados às principais marcas de CNC do mercado</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="fas fa-phone text-primary"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Contato direto</h4>
                    <p className="text-muted-foreground text-sm">Telefone e WhatsApp para agilizar seu atendimento</p>
                  </div>
                </div>
              </div>
              <Button 
                size="lg" 
                className="bg-secondary hover:bg-secondary/90 rounded-full px-8 hover:scale-105 transition-all shadow-lg hover:shadow-xl group"
                onClick={() => window.location.href = '/login'}
                data-testid="button-technicians-directory"
              >
                Ver diretório de técnicos
                <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-card border border-border rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background rounded-2xl p-6 text-center hover:scale-105 transition-transform cursor-default">
                    <i className="fas fa-wrench text-4xl text-primary mb-3"></i>
                    <div className="text-3xl font-bold mb-1">50+</div>
                    <div className="text-sm text-muted-foreground">Técnicos</div>
                  </div>
                  <div className="bg-background rounded-2xl p-6 text-center hover:scale-105 transition-transform cursor-default">
                    <i className="fas fa-map-marked-alt text-4xl text-secondary mb-3"></i>
                    <div className="text-3xl font-bold mb-1">27</div>
                    <div className="text-sm text-muted-foreground">Estados</div>
                  </div>
                  <div className="bg-background rounded-2xl p-6 text-center hover:scale-105 transition-transform cursor-default">
                    <i className="fas fa-star text-4xl text-primary mb-3"></i>
                    <div className="text-3xl font-bold mb-1">4.9</div>
                    <div className="text-sm text-muted-foreground">Avaliação</div>
                  </div>
                  <div className="bg-background rounded-2xl p-6 text-center hover:scale-105 transition-transform cursor-default">
                    <i className="fas fa-clock text-4xl text-secondary mb-3"></i>
                    <div className="text-3xl font-bold mb-1">24h</div>
                    <div className="text-sm text-muted-foreground">Resposta</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium text-primary">Junte-se a nós hoje</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Pronto para transformar{" "}
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              suas ideias?
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Cadastre-se gratuitamente e comece a fazer parte da maior comunidade de marcenaria CNC do Brasil.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-7 text-xl rounded-full shadow-2xl hover:shadow-primary/50 hover:scale-110 transition-all group"
              onClick={() => window.location.href = '/login'}
            >
              <i className="fas fa-rocket mr-2"></i>
              Começar Agora - É Grátis
              <i className="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            Sem cartão de crédito • Acesso imediato • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/logo.png" 
                  alt="MarceConnect" 
                  className="w-12 h-12 object-contain rounded-lg"
                />
                <div>
                  <h3 className="text-xl font-bold">MarceConnect</h3>
                  <p className="text-xs text-muted-foreground">Conectando Marceneiros</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed max-w-md">
                A plataforma que conecta marceneiros, técnicos e empresas de todo o Brasil. Compartilhando projetos, conhecimento e oportunidades.
              </p>
              <div className="flex gap-3">
                <a 
                  href="https://chat.whatsapp.com/ITDRe3LpfSx0e9DwYqfqrR" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary/10 hover:bg-primary/20 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                >
                  <i className="fab fa-whatsapp text-primary text-xl"></i>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-lg">Links Rápidos</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/projects" className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                    <i className="fas fa-chevron-right text-xs mr-2 group-hover:translate-x-1 transition-transform"></i>
                    Projetos
                  </Link>
                </li>
                <li>
                  <Link href="/technicians" className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                    <i className="fas fa-chevron-right text-xs mr-2 group-hover:translate-x-1 transition-transform"></i>
                    Técnicos
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                    <i className="fas fa-chevron-right text-xs mr-2 group-hover:translate-x-1 transition-transform"></i>
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/files" className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                    <i className="fas fa-chevron-right text-xs mr-2 group-hover:translate-x-1 transition-transform"></i>
                    Arquivos
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-lg">Comunidade</h4>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://chat.whatsapp.com/ITDRe3LpfSx0e9DwYqfqrR" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center group"
                  >
                    <i className="fas fa-chevron-right text-xs mr-2 group-hover:translate-x-1 transition-transform"></i>
                    Grupo WhatsApp
                  </a>
                </li>
                <li>
                  <button 
                    onClick={() => window.location.href = '/login'}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center group text-left"
                  >
                    <i className="fas fa-chevron-right text-xs mr-2 group-hover:translate-x-1 transition-transform"></i>
                    Entrar / Cadastrar
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} MarceConnect. Todos os direitos reservados. Feito com{" "}
              <i className="fas fa-heart text-red-500 animate-pulse"></i> para a comunidade.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
