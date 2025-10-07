import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useImageUpload } from "@/hooks/useImageUpload";
import type { ProjectWithAuthor, CncBrand } from "@shared/schema";

export default function AdminPanel() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(null);
  const [imageType, setImageType] = useState<"hero" | "logo" | "banner">("hero");

  const [brandName, setBrandName] = useState("");
  const [brandWebsite, setBrandWebsite] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [brandCategory, setBrandCategory] = useState<"router" | "software" | "tools">("router");
  const [brandIsSponsor, setBrandIsSponsor] = useState(false);
  const [editingBrand, setEditingBrand] = useState<CncBrand | null>(null);
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  
  const [brandSearchTerm, setBrandSearchTerm] = useState("");
  const [brandCategoryFilter, setBrandCategoryFilter] = useState<"all" | "router" | "software" | "tools">("all");

  // User management state
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Hook para upload automático com redimensionamento
  const { uploadImage, uploading, progress } = useImageUpload({
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
  });

  const { uploadImage: uploadLogo, uploading: uploadingLogo } = useImageUpload({
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.9,
  });

  const { data: allProjects } = useQuery<ProjectWithAuthor[]>({
    queryKey: ["/api/projects"],
    enabled: !!user?.isAdmin,
  });

  const { data: stats } = useQuery<{
    totalUsers: string;
    totalProjects: string;
    totalDownloads: string;
    totalLikes: string;
    totalBlogPosts: string;
  }>({
    queryKey: ["/api/statistics"],
    enabled: !!user?.isAdmin,
  });

  const { data: cncBrands } = useQuery<CncBrand[]>({
    queryKey: ["/api/cnc-brands"],
    enabled: !!user?.isAdmin,
  });

  const { data: allUsers } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin,
  });

  const filteredUsers = allUsers?.filter((u) => {
    if (!userSearchTerm) return true;
    const searchLower = userSearchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(searchLower) ||
      u.firstName?.toLowerCase().includes(searchLower) ||
      u.lastName?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const filteredBrands = cncBrands?.filter((brand) => {
    const matchesSearch = brand.name.toLowerCase().includes(brandSearchTerm.toLowerCase());
    const matchesCategory = brandCategoryFilter === "all" || brand.category === brandCategoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  const brandStats = {
    total: cncBrands?.length || 0,
    router: cncBrands?.filter(b => b.category === "router").length || 0,
    software: cncBrands?.filter(b => b.category === "software").length || 0,
    tools: cncBrands?.filter(b => b.category === "tools").length || 0,
  };

  // Manage image preview URL to prevent memory leaks
  useEffect(() => {
    if (selectedImage) {
      const url = URL.createObjectURL(selectedImage);
      setSelectedImagePreviewUrl(url);
      
      // Cleanup function to revoke the object URL
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setSelectedImagePreviewUrl(null);
    }
  }, [selectedImage]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para acessar o painel admin",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    if (!authLoading && user && !user.isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/");
      }, 500);
    }
  }, [user, isAuthenticated, authLoading, toast, setLocation]);

  const handleImageUpload = async () => {
    if (!selectedImage) return;

    try {
      const url = await uploadImage(selectedImage);
      toast({
        title: "Imagem enviada!",
        description: `URL: ${url}`,
      });
      setSelectedImage(null);
    } catch (error) {
      // Erro já é tratado pelo hook
    }
  };

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await apiRequest("DELETE", `/api/projects/${projectId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Projeto deletado",
        description: "O projeto foi removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: () => {
      toast({
        title: "Erro ao deletar projeto",
        variant: "destructive",
      });
    },
  });

  const createBrandMutation = useMutation({
    mutationFn: async (brandData: { name: string; website?: string; logoUrl?: string; description?: string; category?: string; isSponsor?: boolean }) => {
      const response = await apiRequest("POST", "/api/cnc-brands", brandData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Marca criada!",
        description: "Nova marca parceira adicionada",
      });
      setBrandName("");
      setBrandWebsite("");
      setBrandLogoUrl("");
      setBrandDescription("");
      setBrandCategory("router");
      setBrandIsSponsor(false);
      setBrandLogoFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/cnc-brands"] });
    },
    onError: () => {
      toast({
        title: "Erro ao criar marca",
        variant: "destructive",
      });
    },
  });

  const updateBrandMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/cnc-brands/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Marca atualizada!",
        description: "As alterações foram salvas",
      });
      setEditingBrand(null);
      setBrandName("");
      setBrandWebsite("");
      setBrandLogoUrl("");
      setBrandDescription("");
      setBrandCategory("router");
      setBrandIsSponsor(false);
      setBrandLogoFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/cnc-brands"] });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar marca",
        variant: "destructive",
      });
    },
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async (brandId: string) => {
      const response = await apiRequest("DELETE", `/api/cnc-brands/${brandId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Marca deletada",
        description: "A marca foi removida com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cnc-brands"] });
    },
    onError: () => {
      toast({
        title: "Erro ao deletar marca",
        variant: "destructive",
      });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", "/api/admin/ban-user", { userId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário banido",
        description: "O usuário foi banido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
    },
    onError: () => {
      toast({
        title: "Erro ao banir usuário",
        variant: "destructive",
      });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", "/api/admin/unban-user", { userId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário desbanido",
        description: "O usuário foi desbanido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
    },
    onError: () => {
      toast({
        title: "Erro ao desbanir usuário",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const response = await apiRequest("POST", "/api/admin/reset-password", { userId, newPassword });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha redefinida",
        description: "A senha do usuário foi redefinida com sucesso",
      });
      setNewPassword("");
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const handleSaveBrand = () => {
    if (!brandName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira o nome da marca",
        variant: "destructive",
      });
      return;
    }

    if (editingBrand) {
      updateBrandMutation.mutate({
        id: editingBrand.id,
        data: {
          name: brandName,
          website: brandWebsite || undefined,
          logoUrl: brandLogoUrl || undefined,
          description: brandDescription || undefined,
          category: brandCategory,
          isSponsor: brandIsSponsor,
        },
      });
    } else {
      createBrandMutation.mutate({
        name: brandName,
        website: brandWebsite || undefined,
        logoUrl: brandLogoUrl || undefined,
        description: brandDescription || undefined,
        category: brandCategory,
        isSponsor: brandIsSponsor,
      });
    }
  };

  const handleEditBrand = (brand: CncBrand) => {
    setEditingBrand(brand);
    setBrandName(brand.name);
    setBrandWebsite(brand.website || "");
    setBrandLogoUrl(brand.logoUrl || "");
    setBrandDescription(brand.description || "");
    setBrandCategory((brand.category as "router" | "software" | "tools") || "router");
    setBrandIsSponsor(brand.isSponsor || false);
  };

  const handleCancelEditBrand = () => {
    setEditingBrand(null);
    setBrandName("");
    setBrandWebsite("");
    setBrandLogoUrl("");
    setBrandDescription("");
    setBrandCategory("router");
    setBrandIsSponsor(false);
    setBrandLogoFile(null);
  };

  const handleUploadBrandLogo = async () => {
    if (!brandLogoFile) return;

    try {
      const url = await uploadLogo(brandLogoFile);
      setBrandLogoUrl(url);
      setBrandLogoFile(null);
      toast({
        title: "Logo enviado!",
        description: "Imagem redimensionada e otimizada automaticamente",
      });
    } catch (error) {
      // Erro já é tratado pelo hook
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

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <i className="fas fa-shield-alt text-primary mr-3"></i>
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground mt-2">
            Controle total do site e gerenciamento de conteúdo
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Usuários</p>
                  <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                </div>
                <i className="fas fa-users text-3xl text-primary"></i>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Projetos</p>
                  <p className="text-2xl font-bold">{stats?.totalProjects || 0}</p>
                </div>
                <i className="fas fa-folder text-3xl text-secondary"></i>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Downloads</p>
                  <p className="text-2xl font-bold">{stats?.totalDownloads || 0}</p>
                </div>
                <i className="fas fa-download text-3xl text-blue-500"></i>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Curtidas</p>
                  <p className="text-2xl font-bold">{stats?.totalLikes || 0}</p>
                </div>
                <i className="fas fa-heart text-3xl text-red-500"></i>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="images" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="images" data-testid="tab-images">
              <i className="fas fa-image mr-2"></i>
              Imagens
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <i className="fas fa-users mr-2"></i>
              Usuários ({allUsers?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="brands" data-testid="tab-brands">
              <i className="fas fa-industry mr-2"></i>
              Marcas ({cncBrands?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="projects" data-testid="tab-projects">
              <i className="fas fa-folder mr-2"></i>
              Projetos ({allProjects?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <i className="fas fa-cog mr-2"></i>
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Image Management Tab */}
          <TabsContent value="images">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-images mr-2 text-primary"></i>
                  Upload de Imagens do Site
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Faça upload de imagens para usar no hero, logo, banners, etc. As imagens são automaticamente otimizadas.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="image-type">Tipo de Imagem</Label>
                  <select
                    id="image-type"
                    value={imageType}
                    onChange={(e) => setImageType(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-md"
                    data-testid="select-image-type"
                  >
                    <option value="hero">🎭 Hero / Banner Principal</option>
                    <option value="logo">🏷️ Logo</option>
                    <option value="banner">📢 Banner Secundário</option>
                  </select>
                </div>

                {/* Preview da imagem selecionada */}
                {selectedImage && selectedImagePreviewUrl && (
                  <div className="relative group">
                    <div className="w-full p-8 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center space-y-3">
                      <img
                        src={selectedImagePreviewUrl}
                        alt="Preview"
                        className="max-w-full max-h-64 object-contain rounded shadow-lg"
                      />
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-file-image"></i>
                          <span className="font-medium">{selectedImage.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-weight-hanging"></i>
                          <span>{(selectedImage.size / 1024).toFixed(2)} KB</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedImage(null);
                        const input = document.getElementById('image-file') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid="button-clear-selected-image"
                    >
                      <i className="fas fa-times mr-2"></i>
                      Remover
                    </Button>
                  </div>
                )}

                <div>
                  <Label htmlFor="image-file">
                    {selectedImage ? "Trocar Imagem" : "Selecionar Imagem"}
                  </Label>
                  <Input
                    id="image-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                    className="cursor-pointer mt-1"
                    data-testid="input-image-file"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos aceitos: JPG, PNG, GIF, WebP | Tamanho máximo: 50MB
                  </p>
                </div>

                <Button
                  onClick={handleImageUpload}
                  disabled={!selectedImage || uploading}
                  className="w-full bg-primary hover:bg-primary/90 py-6 text-lg"
                  data-testid="button-upload-image"
                >
                  {uploading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-3 text-xl"></i>
                      Enviando... {progress}%
                    </>
                  ) : (
                    <>
                      <i className="fas fa-cloud-upload-alt mr-3 text-xl"></i>
                      Fazer Upload da Imagem
                    </>
                  )}
                </Button>

                <div className="mt-6 p-5 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-border">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                    Como usar as imagens:
                  </h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Selecione o tipo de imagem (Hero, Logo ou Banner)</li>
                    <li>Escolha uma imagem do seu computador</li>
                    <li>Clique em "Fazer Upload" e aguarde o processamento</li>
                    <li>Copie a URL que aparece no toast de sucesso</li>
                    <li>Cole a URL no código do site onde precisar</li>
                  </ol>
                  <div className="mt-4 p-3 bg-muted/50 rounded flex items-start gap-2">
                    <i className="fas fa-magic text-primary mt-1"></i>
                    <p className="text-xs text-muted-foreground">
                      <strong>Otimização Automática:</strong> Todas as imagens são redimensionadas e comprimidas automaticamente para melhor performance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users">
            <div className="space-y-6">
              {/* Search Bar */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-search text-muted-foreground"></i>
                    <Input
                      placeholder="Buscar usuário por email, nome..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="flex-1"
                      data-testid="input-search-users"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Users List */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-users mr-2 text-primary"></i>
                    Gerenciar Usuários
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Visualize e gerencie todos os usuários da plataforma
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredUsers && filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          data-testid={`user-${u.id}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">
                                {u.firstName} {u.lastName || ""}
                              </h4>
                              {u.isAdmin && (
                                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded">
                                  <i className="fas fa-shield-alt mr-1"></i>
                                  ADMIN
                                </span>
                              )}
                              {u.isBanned && (
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-xs font-medium rounded">
                                  <i className="fas fa-ban mr-1"></i>
                                  BANIDO
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {u.email} • {u.accountType || "USER"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Criado em: {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(u)}
                              data-testid={`manage-${u.id}`}
                            >
                              <i className="fas fa-cog mr-1"></i>
                              Gerenciar
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <i className="fas fa-user-slash text-3xl mb-2"></i>
                        <p>
                          {userSearchTerm 
                            ? "Nenhum usuário encontrado com o termo de busca" 
                            : "Nenhum usuário encontrado"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* User Actions Modal/Card */}
              {selectedUser && (
                <Card className="bg-card border-border border-2 border-primary/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <i className="fas fa-user-edit mr-2 text-primary"></i>
                        Gerenciar: {selectedUser.firstName} {selectedUser.lastName}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(null);
                          setNewPassword("");
                        }}
                        data-testid="close-user-management"
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Reset Password Section */}
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <h4 className="font-semibold flex items-center text-blue-500 mb-3">
                        <i className="fas fa-key mr-2"></i>
                        Redefinir Senha
                      </h4>
                      <div className="space-y-3">
                        <Input
                          type="password"
                          placeholder="Nova senha (mínimo 6 caracteres)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          data-testid="input-new-password"
                        />
                        <Button
                          onClick={() => {
                            if (newPassword.length < 6) {
                              toast({
                                title: "Senha muito curta",
                                description: "A senha deve ter pelo menos 6 caracteres",
                                variant: "destructive",
                              });
                              return;
                            }
                            if (confirm(`Redefinir senha de ${selectedUser.email}?`)) {
                              resetPasswordMutation.mutate({
                                userId: selectedUser.id,
                                newPassword,
                              });
                            }
                          }}
                          disabled={resetPasswordMutation.isPending || !newPassword}
                          className="w-full"
                          data-testid="button-reset-password"
                        >
                          {resetPasswordMutation.isPending ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Redefinindo...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-key mr-2"></i>
                              Redefinir Senha
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Ban/Unban Section */}
                    <div className={`p-4 border rounded-lg ${
                      selectedUser.isBanned 
                        ? "bg-green-500/10 border-green-500/20" 
                        : "bg-red-500/10 border-red-500/20"
                    }`}>
                      <h4 className={`font-semibold flex items-center mb-3 ${
                        selectedUser.isBanned ? "text-green-500" : "text-red-500"
                      }`}>
                        <i className={`fas ${selectedUser.isBanned ? "fa-check-circle" : "fa-ban"} mr-2`}></i>
                        {selectedUser.isBanned ? "Desbanir Usuário" : "Banir Usuário"}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {selectedUser.isBanned 
                          ? "Este usuário está banido e não pode fazer login. Clique para desbanir." 
                          : "Ao banir, o usuário não poderá mais fazer login na plataforma."}
                      </p>
                      {selectedUser.isBanned ? (
                        <Button
                          onClick={() => {
                            if (confirm(`Desbanir ${selectedUser.email}?`)) {
                              unbanUserMutation.mutate(selectedUser.id);
                            }
                          }}
                          disabled={unbanUserMutation.isPending}
                          className="w-full bg-green-600 hover:bg-green-700"
                          data-testid="button-unban-user"
                        >
                          {unbanUserMutation.isPending ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Desbanindo...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-check-circle mr-2"></i>
                              Desbanir Usuário
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja banir ${selectedUser.email}? O usuário não poderá mais fazer login.`)) {
                              banUserMutation.mutate(selectedUser.id);
                            }
                          }}
                          disabled={banUserMutation.isPending}
                          variant="destructive"
                          className="w-full"
                          data-testid="button-ban-user"
                        >
                          {banUserMutation.isPending ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Banindo...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-ban mr-2"></i>
                              Banir Usuário
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* CNC Brands Tab */}
          <TabsContent value="brands">
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Marcas</p>
                        <p className="text-3xl font-bold text-primary">{brandStats.total}</p>
                      </div>
                      <i className="fas fa-industry text-4xl text-primary opacity-50"></i>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Routers CNC</p>
                        <p className="text-3xl font-bold text-blue-500">{brandStats.router}</p>
                      </div>
                      <i className="fas fa-cogs text-4xl text-blue-500 opacity-50"></i>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Software</p>
                        <p className="text-3xl font-bold text-purple-500">{brandStats.software}</p>
                      </div>
                      <i className="fas fa-laptop-code text-4xl text-purple-500 opacity-50"></i>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ferramentas</p>
                        <p className="text-3xl font-bold text-orange-500">{brandStats.tools}</p>
                      </div>
                      <i className="fas fa-tools text-4xl text-orange-500 opacity-50"></i>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Add/Edit Form */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className={`fas ${editingBrand ? 'fa-edit' : 'fa-plus-circle'} mr-2 text-primary`}></i>
                    {editingBrand ? "Editar Marca" : "Adicionar Nova Marca"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {editingBrand ? "Atualize as informações da marca" : "Cadastre uma nova marca parceira"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="brand-name">Nome da Marca *</Label>
                    <Input
                      id="brand-name"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Ex: Wood Router CNC"
                      className="mt-1"
                      data-testid="input-brand-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="brand-website">Website</Label>
                    <Input
                      id="brand-website"
                      value={brandWebsite}
                      onChange={(e) => setBrandWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="mt-1"
                      data-testid="input-brand-website"
                    />
                  </div>

                  <div>
                    <Label htmlFor="brand-logo">Logo da Marca</Label>
                    <div className="space-y-3 mt-1">
                      {/* Preview da logo atual */}
                      {brandLogoUrl && (
                        <div className="relative group">
                          <div className="w-full p-6 bg-muted/30 rounded-lg border-2 border-border flex items-center justify-center">
                            <img
                              src={brandLogoUrl}
                              alt="Preview do logo"
                              className="max-w-full max-h-32 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('hidden');
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setBrandLogoUrl("");
                              setBrandLogoFile(null);
                              toast({
                                title: "Logo removido",
                                description: "A logo foi removida. Clique em 'Salvar' para confirmar as alterações.",
                              });
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid="button-remove-brand-logo"
                          >
                            <i className="fas fa-trash mr-2"></i>
                            Remover Logo
                          </Button>
                        </div>
                      )}

                      {/* Upload de nova logo */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            id="brand-logo-file"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setBrandLogoFile(e.target.files?.[0] || null)}
                            className="cursor-pointer flex-1"
                            data-testid="input-brand-logo-file"
                          />
                          <Button
                            type="button"
                            onClick={handleUploadBrandLogo}
                            disabled={!brandLogoFile || uploadingLogo}
                            variant="secondary"
                            data-testid="button-upload-brand-logo"
                          >
                            {uploadingLogo ? (
                              <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Enviando...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-upload mr-2"></i>
                                Upload
                              </>
                            )}
                          </Button>
                        </div>
                        {brandLogoFile && !uploadingLogo && (
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border">
                            <div className="flex items-center gap-2">
                              <i className="fas fa-image text-primary"></i>
                              <div>
                                <p className="text-sm font-medium">{brandLogoFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(brandLogoFile.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                            <i className="fas fa-check-circle text-green-500"></i>
                          </div>
                        )}
                      </div>

                      {/* Campo manual de URL (opcional) */}
                      {!brandLogoFile && (
                        <div>
                          <Label htmlFor="brand-logo-url" className="text-xs text-muted-foreground">
                            Ou insira a URL manualmente
                          </Label>
                          <Input
                            id="brand-logo-url"
                            value={brandLogoUrl}
                            onChange={(e) => setBrandLogoUrl(e.target.value)}
                            placeholder="https://example.com/logo.png"
                            className="mt-1"
                            data-testid="input-brand-logo-url"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="brand-description">Descrição</Label>
                    <Textarea
                      id="brand-description"
                      value={brandDescription}
                      onChange={(e) => setBrandDescription(e.target.value)}
                      placeholder="Breve descrição da marca..."
                      className="mt-1"
                      rows={3}
                      data-testid="input-brand-description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="brand-category">Categoria / Ramo *</Label>
                    <Select value={brandCategory} onValueChange={(value: "router" | "software" | "tools") => setBrandCategory(value)}>
                      <SelectTrigger className="mt-1" data-testid="select-brand-category">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="router">Routers CNC</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="tools">Ferramentas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                    <input
                      id="brand-is-sponsor"
                      type="checkbox"
                      checked={brandIsSponsor}
                      onChange={(e) => setBrandIsSponsor(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      data-testid="checkbox-brand-sponsor"
                    />
                    <div className="flex-1">
                      <Label htmlFor="brand-is-sponsor" className="cursor-pointer font-semibold flex items-center gap-2">
                        <i className="fas fa-star text-yellow-500"></i>
                        Patrocinador
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Patrocinadores aparecem na página inicial para todos os visitantes. 
                        Marcas não patrocinadoras ficam disponíveis apenas internamente para técnicos e usuários escolherem.
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveBrand}
                      disabled={createBrandMutation.isPending || updateBrandMutation.isPending}
                      className="flex-1"
                      data-testid="button-save-brand"
                    >
                      <i className="fas fa-save mr-2"></i>
                      {editingBrand ? "Salvar Alterações" : "Adicionar Marca"}
                    </Button>
                    {editingBrand && (
                      <Button
                        onClick={handleCancelEditBrand}
                        variant="outline"
                        data-testid="button-cancel-edit-brand"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Search and Filters */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-filter mr-2 text-primary"></i>
                    Buscar e Filtrar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brand-search">Buscar por nome</Label>
                      <div className="relative mt-1">
                        <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                        <Input
                          id="brand-search"
                          value={brandSearchTerm}
                          onChange={(e) => setBrandSearchTerm(e.target.value)}
                          placeholder="Digite o nome da marca..."
                          className="pl-10"
                          data-testid="input-brand-search"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="brand-category-filter">Filtrar por categoria</Label>
                      <Select value={brandCategoryFilter} onValueChange={(value: "all" | "router" | "software" | "tools") => setBrandCategoryFilter(value)}>
                        <SelectTrigger className="mt-1" data-testid="select-brand-category-filter">
                          <SelectValue placeholder="Todas as categorias" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as categorias</SelectItem>
                          <SelectItem value="router">Routers CNC</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                          <SelectItem value="tools">Ferramentas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-muted-foreground">
                    Mostrando {filteredBrands.length} de {cncBrands?.length || 0} marcas
                  </div>
                </CardContent>
              </Card>

              {/* Brands Grid */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <i className="fas fa-th-large mr-2 text-primary"></i>
                  Marcas Cadastradas
                </h3>
                {filteredBrands.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBrands.map((brand) => (
                      <Card
                        key={brand.id}
                        className="bg-card border-border hover:border-primary/50 transition-all group"
                        data-testid={`brand-${brand.id}`}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col h-full">
                            {/* Logo and Badges */}
                            <div className="flex items-start justify-between mb-4">
                              {brand.logoUrl ? (
                                <div className="w-20 h-20 flex items-center justify-center rounded border border-border group-hover:border-primary/30 transition-all">
                                  <img
                                    src={brand.logoUrl}
                                    alt={brand.name}
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-20 h-20 flex items-center justify-center rounded border border-border bg-muted group-hover:border-primary/30 transition-all">
                                  <i className="fas fa-industry text-3xl text-muted-foreground"></i>
                                </div>
                              )}
                              <div className="flex flex-col gap-2">
                                {brand.isSponsor && (
                                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-yellow-500/10 text-yellow-600 flex items-center gap-1">
                                    <i className="fas fa-star"></i>
                                    Patrocinador
                                  </span>
                                )}
                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                  brand.category === 'router' 
                                    ? 'bg-blue-500/10 text-blue-500' 
                                    : brand.category === 'software' 
                                    ? 'bg-purple-500/10 text-purple-500' 
                                    : 'bg-orange-500/10 text-orange-500'
                                }`}>
                                  {brand.category === 'router' ? 'Router CNC' : brand.category === 'software' ? 'Software' : 'Ferramentas'}
                                </span>
                              </div>
                            </div>

                            {/* Brand Info */}
                            <div className="flex-1">
                              <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{brand.name}</h4>
                              {brand.website && (
                                <a
                                  href={brand.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline flex items-center gap-1 mb-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <i className="fas fa-external-link-alt text-xs"></i>
                                  Visitar site
                                </a>
                              )}
                              {brand.description && (
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                  {brand.description}
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-4 border-t border-border">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditBrand(brand)}
                                className="flex-1"
                                data-testid={`edit-brand-${brand.id}`}
                              >
                                <i className="fas fa-edit mr-2"></i>
                                Editar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteBrandMutation.mutate(brand.id)}
                                disabled={deleteBrandMutation.isPending}
                                data-testid={`delete-brand-${brand.id}`}
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-muted/50 border-dashed">
                    <CardContent className="p-12 text-center">
                      <i className="fas fa-inbox text-5xl text-muted-foreground mb-4"></i>
                      <p className="text-lg text-muted-foreground mb-2">
                        {brandSearchTerm || brandCategoryFilter !== "all" 
                          ? "Nenhuma marca encontrada com os filtros aplicados" 
                          : "Nenhuma marca cadastrada ainda"}
                      </p>
                      {(brandSearchTerm || brandCategoryFilter !== "all") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBrandSearchTerm("");
                            setBrandCategoryFilter("all");
                          }}
                          className="mt-4"
                        >
                          <i className="fas fa-times mr-2"></i>
                          Limpar filtros
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Projects Management Tab */}
          <TabsContent value="projects">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Gerenciar Projetos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Visualize e gerencie todos os projetos da plataforma
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allProjects && allProjects.length > 0 ? (
                    allProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted"
                        data-testid={`project-${project.id}`}
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{project.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Por: {project.author.firstName || project.author.email} • 
                            {project.downloadCount || 0} downloads • 
                            {project.likeCount || 0} curtidas
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/projects/${project.id}`)}
                            data-testid={`view-${project.id}`}
                          >
                            <i className="fas fa-eye mr-1"></i>
                            Ver
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Deletar projeto "${project.title}"?`)) {
                                deleteProjectMutation.mutate(project.id);
                              }
                            }}
                            data-testid={`delete-${project.id}`}
                          >
                            <i className="fas fa-trash mr-1"></i>
                            Deletar
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <i className="fas fa-folder-open text-3xl mb-2"></i>
                      <p>Nenhum projeto encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Configurações do Site</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <h4 className="font-semibold flex items-center text-primary mb-2">
                      <i className="fas fa-info-circle mr-2"></i>
                      Acesso Total
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Como administrador, você tem acesso completo para editar, deletar e gerenciar todo o conteúdo do site,
                      incluindo projetos, posts de blog, comentários e usuários.
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Permissões de Admin:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>✅ Editar e deletar qualquer projeto</li>
                      <li>✅ Editar e deletar qualquer post de blog</li>
                      <li>✅ Gerenciar comentários</li>
                      <li>✅ Upload e gerenciamento de imagens do site</li>
                      <li>✅ Visualizar estatísticas completas</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
