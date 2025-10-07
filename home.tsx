import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import type { ProjectWithAuthor } from "@shared/schema";

export default function Home() {
  const { data: projects, isLoading } = useQuery<ProjectWithAuthor[]>({
    queryKey: ["/api/projects"],
  });

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allPartners, isLoading: partnersLoading, isError: partnersError } = useQuery<any[]>({
    queryKey: ["/api/cnc-brands"],
  });

  const partners = allPartners?.filter((partner) => partner.isSponsor) || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Section com Background Animado */}
      <section className="relative py-32 overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Ícones decorativos flutuantes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <i className="fas fa-cube absolute top-20 left-10 text-6xl text-primary/20 animate-float"></i>
          <i className="fas fa-cogs absolute top-40 right-20 text-7xl text-secondary/20 animate-float" style={{ animationDelay: '0.5s' }}></i>
          <i className="fas fa-drafting-compass absolute bottom-40 left-1/4 text-5xl text-primary/20 animate-float" style={{ animationDelay: '1s' }}></i>
          <i className="fas fa-ruler-combined absolute bottom-20 right-1/3 text-6xl text-secondary/20 animate-float" style={{ animationDelay: '1.5s' }}></i>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge de boas-vindas */}
            <div className="inline-flex items-center space-x-2 bg-primary/10 px-6 py-3 rounded-full mb-8 animate-fade-in-up border border-primary/20">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <i className="fas fa-sparkles text-primary"></i>
              <span className="text-sm font-medium text-primary">Plataforma em Constante Crescimento</span>
            </div>

            {/* Título principal */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }} data-testid="home-hero-title">
              Bem-Vindo ao <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient">MarceConnect</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
              <i className="fas fa-rocket text-primary mr-2"></i>
              Explore projetos incríveis, compartilhe suas criações e conecte-se com profissionais de todo o Brasil
            </p>

            {/* Botões de ação principais */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link href="/technicians">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-2xl hover:scale-105 transition-all group" data-testid="button-find-technicians">
                  <i className="fas fa-user-gear mr-3 text-xl"></i>
                  Encontrar Técnicos
                  <i className="fas fa-arrow-right ml-3 group-hover:translate-x-1 transition-transform"></i>
                </Button>
              </Link>
              <Link href="/projects">
                <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-2xl hover:scale-105 transition-all group" data-testid="button-upload-project">
                  <i className="fas fa-cloud-arrow-up mr-3 text-xl"></i>
                  Compartilhar Projeto
                  <i className="fas fa-arrow-right ml-3 group-hover:translate-x-1 transition-transform"></i>
                </Button>
              </Link>
              <Link href="/projects">
                <Button 
                  variant="outline"
                  className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-6 text-lg font-semibold rounded-full hover:scale-105 transition-all"
                  data-testid="button-browse-projects"
                >
                  <i className="fas fa-compass mr-3 text-xl"></i>
                  Explorar Projetos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Estatísticas com Cards Elegantes */}
      <section className="py-20 bg-gradient-to-b from-card/50 to-background relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <i className="fas fa-chart-line text-primary"></i>
              <span className="text-sm font-medium text-primary">Estatísticas em Tempo Real</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nossa Comunidade</h2>
            <p className="text-xl text-muted-foreground">Números que refletem nosso crescimento</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:border-primary/50 transition-all hover:scale-105 cursor-default group" data-testid="stat-total-projects">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <i className="fas fa-layer-group text-3xl text-primary"></i>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {projects?.length || 0}
                </div>
                <div className="text-muted-foreground font-medium">Projetos Disponíveis</div>
                <div className="text-xs text-primary mt-2 flex items-center justify-center gap-1">
                  <i className="fas fa-arrow-up text-xs"></i>
                  <span>Em crescimento</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 hover:border-secondary/50 transition-all hover:scale-105 cursor-default group" data-testid="stat-categories">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <i className="fas fa-list text-3xl text-secondary"></i>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">
                  {categories?.length || 0}
                </div>
                <div className="text-muted-foreground font-medium">Categorias</div>
                <div className="text-xs text-secondary mt-2 flex items-center justify-center gap-1">
                  <i className="fas fa-check-circle text-xs"></i>
                  <span>Diversidade</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:border-primary/50 transition-all hover:scale-105 cursor-default group" data-testid="stat-downloads">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <i className="fas fa-cloud-arrow-down text-3xl text-primary"></i>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {projects?.reduce((sum, p) => sum + (p.downloadCount || 0), 0) || 0}
                </div>
                <div className="text-muted-foreground font-medium">Downloads Totais</div>
                <div className="text-xs text-primary mt-2 flex items-center justify-center gap-1">
                  <i className="fas fa-fire text-xs"></i>
                  <span>Popular</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/5 border-red-500/20 hover:border-red-500/50 transition-all hover:scale-105 cursor-default group" data-testid="stat-likes">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <i className="fas fa-heart text-3xl text-red-500"></i>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-red-500 mb-2">
                  {projects?.reduce((sum, p) => sum + (p.likeCount || 0), 0) || 0}
                </div>
                <div className="text-muted-foreground font-medium">Curtidas</div>
                <div className="text-xs text-red-500 mt-2 flex items-center justify-center gap-1">
                  <i className="fas fa-heart-pulse text-xs animate-pulse"></i>
                  <span>Engajamento</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features em Destaque */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-secondary/10 px-4 py-2 rounded-full mb-4">
              <i className="fas fa-star text-secondary"></i>
              <span className="text-sm font-medium text-secondary">Por Que Escolher MarceConnect?</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Tudo em Um Só Lugar</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas profissionais para marceneiros, técnicos e empresas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-background border-border hover:border-primary/50 transition-all group hover:scale-105 hover:shadow-2xl">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <i className="fas fa-users text-4xl text-primary"></i>
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">Comunidade Ativa</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Conecte-se com milhares de profissionais apaixonados por marcenaria CNC
                </p>
                <div className="flex items-center text-sm text-primary font-medium">
                  <i className="fas fa-check-circle mr-2"></i>
                  Networking profissional
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background border-border hover:border-secondary/50 transition-all group hover:scale-105 hover:shadow-2xl">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <i className="fas fa-graduation-cap text-4xl text-secondary"></i>
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-secondary transition-colors">Aprenda e Evolua</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Tutoriais, dicas e conhecimento compartilhado pelos melhores profissionais
                </p>
                <div className="flex items-center text-sm text-secondary font-medium">
                  <i className="fas fa-check-circle mr-2"></i>
                  Conteúdo educacional
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background border-border hover:border-primary/50 transition-all group hover:scale-105 hover:shadow-2xl">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <i className="fas fa-shield text-4xl text-primary"></i>
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">Seguro e Confiável</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Plataforma protegida com autenticação segura e backup de dados
                </p>
                <div className="flex items-center text-sm text-primary font-medium">
                  <i className="fas fa-check-circle mr-2"></i>
                  Proteção garantida
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Projetos Recentes com Design Aprimorado */}
      <section className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                <i className="fas fa-fire text-primary"></i>
                <span className="text-sm font-medium text-primary">Recém-Adicionados</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4" data-testid="recent-projects-title">
                Projetos Recentes
              </h2>
              <p className="text-xl text-muted-foreground">Descubra as últimas criações da comunidade</p>
            </div>
            <Link href="/projects">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 hover:scale-105 transition-all group shadow-lg" data-testid="button-view-all">
                Ver Todos
                <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-card border-border overflow-hidden" data-testid={`skeleton-card-${i}`}>
                  <div className="w-full h-56 bg-muted animate-pulse"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded animate-pulse mb-3"></div>
                    <div className="h-6 bg-muted rounded animate-pulse mb-4"></div>
                    <div className="h-4 bg-muted rounded animate-pulse mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                      <div className="h-4 w-8 bg-muted rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.slice(0, 6).map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-xl">
              <CardContent className="p-20 text-center">
                <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-folder-open text-6xl text-primary/50"></i>
                </div>
                <h3 className="text-2xl font-bold mb-3">Nenhum projeto encontrado</h3>
                <p className="text-muted-foreground mb-8 text-lg">Seja o primeiro a compartilhar um projeto com a comunidade!</p>
                <Link href="/files">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-full hover:scale-105 transition-all group" data-testid="button-share-first">
                    <i className="fas fa-cloud-upload-alt mr-2"></i>
                    Compartilhar Projeto
                    <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-24 bg-gradient-to-b from-background via-card/20 to-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <i className="fas fa-handshake text-primary"></i>
              <span className="text-sm font-medium text-primary">Parcerias de Qualidade</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Nossos Parceiros</h2>
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

      {/* Ações Rápidas com Visual Aprimorado */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-secondary/10 px-4 py-2 rounded-full mb-4">
              <i className="fas fa-bolt text-secondary"></i>
              <span className="text-sm font-medium text-secondary">Acesso Rápido</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" data-testid="quick-actions-title">
              Ações Rápidas
            </h2>
            <p className="text-xl text-muted-foreground">Navegue facilmente pelas funcionalidades principais</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/technicians">
              <Card className="bg-gradient-to-br from-primary/15 to-primary/5 border-primary/30 hover:border-primary hover:shadow-2xl cursor-pointer transition-all group hover:scale-105" data-testid="card-find-technicians">
                <CardContent className="p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-12 -mt-12"></div>
                  <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all relative z-10">
                    <i className="fas fa-user-cog text-4xl text-primary"></i>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-primary">Encontrar Técnicos</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Profissionais especializados em CNC próximos a você
                  </p>
                  <div className="mt-4 inline-flex items-center justify-center text-sm text-primary font-medium w-[160px] mx-auto" data-testid="action-technicians-directory">
                    <span>Acessar diretório</span>
                    <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/files">
              <Card className="bg-background border-border hover:border-secondary hover:shadow-2xl cursor-pointer transition-all group hover:scale-105" data-testid="card-upload-files">
                <CardContent className="p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full -mr-12 -mt-12"></div>
                  <div className="w-20 h-20 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all relative z-10">
                    <i className="fas fa-cloud-upload-alt text-4xl text-secondary"></i>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-secondary transition-colors">Compartilhar Arquivos</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Faça upload dos seus projetos DXF e STL
                  </p>
                  <div className="mt-4 inline-flex items-center justify-center text-sm text-secondary font-medium w-[160px] mx-auto" data-testid="action-upload-files">
                    <span>Enviar arquivos</span>
                    <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/projects">
              <Card className="bg-background border-border hover:border-primary hover:shadow-2xl cursor-pointer transition-all group hover:scale-105" data-testid="card-browse-projects">
                <CardContent className="p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-12 -mt-12"></div>
                  <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all relative z-10">
                    <i className="fas fa-compass text-4xl text-primary"></i>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">Explorar Projetos</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Navegue pela galeria e encontre inspiração
                  </p>
                  <div className="mt-4 inline-flex items-center justify-center text-sm text-primary font-medium w-[160px] mx-auto" data-testid="action-browse-gallery">
                    <span>Ver galeria</span>
                    <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/blog">
              <Card className="bg-background border-border hover:border-secondary hover:shadow-2xl cursor-pointer transition-all group hover:scale-105" data-testid="card-read-blog">
                <CardContent className="p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full -mr-12 -mt-12"></div>
                  <div className="w-20 h-20 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all relative z-10">
                    <i className="fas fa-book-open text-4xl text-secondary"></i>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-secondary transition-colors">Ler Tutoriais</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Aprenda com dicas dos melhores profissionais
                  </p>
                  <div className="mt-4 inline-flex items-center justify-center text-sm text-secondary font-medium w-[160px] mx-auto" data-testid="action-access-blog">
                    <span>Acessar blog</span>
                    <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Final */}
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
            <span className="text-sm font-medium text-primary">Junte-se a Nós</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Comece a criar <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">hoje mesmo</span>
          </h2>

          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Faça parte da maior comunidade de marcenaria CNC do Brasil. Compartilhe, aprenda e conecte-se!
          </p>

          <Link href="/files">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-7 text-xl rounded-full shadow-2xl hover:shadow-primary/50 hover:scale-110 transition-all group">
              <i className="fas fa-rocket mr-3"></i>
              Compartilhar Meu Primeiro Projeto
              <i className="fas fa-arrow-right ml-3 group-hover:translate-x-2 transition-transform"></i>
            </Button>
          </Link>
        </div>
      </section>

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

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-gradient {
          animation: gradient 3s ease infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
