import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useImageUpload } from "@/hooks/useImageUpload";
import type { ProjectWithAuthor } from "@shared/schema";

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [bio, setBio] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTechnical, setIsEditingTechnical] = useState(false);
  
  // Technical/Professional fields
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [cncMachine, setCncMachine] = useState("");
  const [camSoftware, setCamSoftware] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [cncBrandId, setCncBrandId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [showBrandNotFoundAlert, setShowBrandNotFoundAlert] = useState(false);

  // Hook para upload de imagem de perfil com redimensionamento automático
  const { uploadImage, uploading: uploadingImage } = useImageUpload({
    maxWidth: 500,
    maxHeight: 500,
    quality: 0.9,
  });

  const { data: userProjects } = useQuery<ProjectWithAuthor[]>({
    queryKey: ["/api/projects"],
    select: (projects) => projects?.filter(p => p.authorId === user?.id) || [],
    enabled: !!user?.id,
  });

  const { data: cncBrands } = useQuery<any[]>({
    queryKey: ["/api/cnc-brands"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { bio: string }) => {
      const response = await apiRequest("PUT", "/api/profile", profileData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Login necessário",
          description: "Faça login para atualizar seu perfil",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Erro ao atualizar perfil",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    },
  });

  const updateTechnicalMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiRequest("PUT", "/api/profile", profileData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Informações atualizadas!",
        description: "Seus dados profissionais foram salvos com sucesso",
      });
      setIsEditingTechnical(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Login necessário",
          description: "Faça login para atualizar seu perfil",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Erro ao atualizar informações",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    },
  });

  // Initialize bio from user data
  useEffect(() => {
    if (user?.bio) {
      setBio(user.bio);
    }
  }, [user]);

  // Initialize technical/professional fields from user data
  useEffect(() => {
    if (user) {
      setCity(user.city || "");
      setState(user.state || "");
      setPhoneNumber(user.phoneNumber || "");
      setWhatsappNumber(user.whatsappNumber || "");
      setCncMachine(user.cncMachine || "");
      setCamSoftware(user.camSoftware || "");
      setSpecialties(user.specialties?.join(", ") || "");
      setCncBrandId(user.cncBrandId || "");
      setCompanyName(user.companyName || "");
      setJobTitle(user.jobTitle || "");
      setCompanyWebsite(user.companyWebsite || "");
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para acessar seu perfil",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const handleSaveBio = () => {
    updateProfileMutation.mutate({ bio: bio.trim() });
  };

  const handleCancelEdit = () => {
    setBio(user?.bio || "");
    setIsEditing(false);
  };

  const handleSaveTechnical = () => {
    const profileData: any = {};
    
    if (user?.accountType === "TECHNICAL") {
      profileData.city = city.trim();
      profileData.state = state.trim();
      profileData.phoneNumber = phoneNumber.trim();
      profileData.whatsappNumber = whatsappNumber.trim();
      profileData.cncMachine = cncMachine.trim();
      profileData.camSoftware = camSoftware.trim();
      profileData.specialties = specialties.trim() ? specialties.split(",").map(s => s.trim()) : [];
      profileData.cncBrandId = cncBrandId || null;
    } else if (user?.accountType === "COMPANY" || user?.accountType === "MACHINE_REP" || user?.accountType === "SOFTWARE_REP") {
      profileData.companyName = companyName.trim();
      profileData.jobTitle = jobTitle.trim();
      profileData.companyWebsite = companyWebsite.trim();
      profileData.phoneNumber = phoneNumber.trim();
      profileData.whatsappNumber = whatsappNumber.trim();
      profileData.city = city.trim();
      profileData.state = state.trim();
      
      // Para representantes, salvar a marca/software representado
      if (user?.accountType === "MACHINE_REP" || user?.accountType === "SOFTWARE_REP") {
        profileData.cncBrandId = cncBrandId || null;
      }
    }
    
    updateTechnicalMutation.mutate(profileData);
  };

  const handleCancelTechnical = () => {
    if (user) {
      setCity(user.city || "");
      setState(user.state || "");
      setPhoneNumber(user.phoneNumber || "");
      setWhatsappNumber(user.whatsappNumber || "");
      setCncMachine(user.cncMachine || "");
      setCamSoftware(user.camSoftware || "");
      setSpecialties(user.specialties?.join(", ") || "");
      setCncBrandId(user.cncBrandId || "");
      setCompanyName(user.companyName || "");
      setJobTitle(user.jobTitle || "");
      setCompanyWebsite(user.companyWebsite || "");
    }
    setShowBrandNotFoundAlert(false);
    setIsEditingTechnical(false);
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Upload com redimensionamento automático
      const url = await uploadImage(file);
      
      // Update profile with new image URL
      const updateResponse = await apiRequest("PUT", "/api/profile", {
        profileImageUrl: url
      });

      if (!updateResponse.ok) {
        throw new Error('Falha ao atualizar perfil');
      }

      toast({
        title: "Foto de perfil atualizada!",
        description: "Sua foto foi redimensionada e otimizada automaticamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <i className="fas fa-user-slash text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Usuário não encontrado</h3>
              <p className="text-muted-foreground mb-6">Não foi possível carregar as informações do perfil</p>
              <Button onClick={() => window.location.href = "/api/login"}>
                <i className="fas fa-sign-in-alt mr-2"></i>
                Fazer Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = {
    projects: userProjects?.length || 0,
    downloads: userProjects?.reduce((sum, p) => sum + (p.downloadCount || 0), 0) || 0,
    likes: userProjects?.reduce((sum, p) => sum + (p.likeCount || 0), 0) || 0,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="bg-card border-border mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                <Avatar className="w-24 h-24" data-testid="profile-avatar">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="text-2xl">
                    {user.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                  id="profile-image-upload"
                  data-testid="input-profile-image"
                />
                <label
                  htmlFor="profile-image-upload"
                  className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-2 cursor-pointer transition-colors"
                  data-testid="button-upload-profile-image"
                >
                  {uploadingImage ? (
                    <i className="fas fa-spinner fa-spin text-sm"></i>
                  ) : (
                    <i className="fas fa-camera text-sm"></i>
                  )}
                </label>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold" data-testid="profile-name">
                    {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "Usuário"}
                  </h1>
                  {user.accountType === "TECHNICAL" && (
                    <span className="px-3 py-1 bg-secondary/20 text-secondary border border-secondary/30 rounded-full text-sm font-semibold" data-testid="badge-technical">
                      <i className="fas fa-tools mr-1"></i>
                      Técnico CNC
                    </span>
                  )}
                  {user.accountType === "COMPANY" && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-sm font-semibold" data-testid="badge-company">
                      <i className="fas fa-building mr-1"></i>
                      Empresa
                    </span>
                  )}
                  {user.isAdmin && (
                    <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-sm font-semibold" data-testid="badge-admin">
                      <i className="fas fa-shield-alt mr-1"></i>
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mb-2" data-testid="profile-email">
                  {user.email}
                </p>
                {user.accountType === "COMPANY" && user.companyName && (
                  <p className="text-muted-foreground mb-4 flex items-center" data-testid="profile-company">
                    <i className="fas fa-building mr-2 text-blue-400"></i>
                    {user.companyName}
                    {user.jobTitle && ` • ${user.jobTitle}`}
                  </p>
                )}
                {(user.accountType === "TECHNICAL" || user.accountType === "COMPANY") && (user.cncMachine || user.camSoftware) && (
                  <div className="text-sm text-muted-foreground mb-4 space-y-1" data-testid="profile-technical-info">
                    {user.cncMachine && (
                      <p><i className="fas fa-cogs mr-2 text-secondary"></i>CNC: {user.cncMachine}</p>
                    )}
                    {user.camSoftware && (
                      <p><i className="fas fa-laptop-code mr-2 text-secondary"></i>CAM: {user.camSoftware}</p>
                    )}
                  </div>
                )}
                
                {/* Bio Section */}
                <div className="mb-4">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Conte um pouco sobre você, sua experiência com marcenaria CNC..."
                        className="bg-input border-border"
                        rows={3}
                        data-testid="bio-textarea"
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleSaveBio}
                          disabled={updateProfileMutation.isPending}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          data-testid="save-bio-button"
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Salvando...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-check mr-2"></i>
                              Salvar
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancelEdit}
                          disabled={updateProfileMutation.isPending}
                          data-testid="cancel-bio-button"
                        >
                          <i className="fas fa-times mr-2"></i>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <p className="text-muted-foreground flex-1" data-testid="profile-bio">
                        {user.bio || "Nenhuma descrição adicionada ainda."}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="ml-2"
                        data-testid="edit-bio-button"
                      >
                        <i className="fas fa-edit mr-2"></i>
                        Editar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex space-x-6">
                  <div className="text-center" data-testid="stat-projects">
                    <div className="text-2xl font-bold text-primary flex items-center justify-center">
                      <i className="fas fa-folder text-lg mr-2"></i>
                      {stats.projects}
                    </div>
                    <div className="text-sm text-muted-foreground">Projetos</div>
                  </div>
                  <div className="text-center" data-testid="stat-downloads">
                    <div className="text-2xl font-bold text-primary flex items-center justify-center">
                      <i className="fas fa-download text-lg mr-2"></i>
                      {stats.downloads}
                    </div>
                    <div className="text-sm text-muted-foreground">Downloads</div>
                  </div>
                  <div className="text-center" data-testid="stat-likes">
                    <div className="text-2xl font-bold text-primary flex items-center justify-center">
                      <i className="fas fa-heart text-lg mr-2"></i>
                      {stats.likes}
                    </div>
                    <div className="text-sm text-muted-foreground">Curtidas</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical/Professional Information Section */}
        {(user.accountType === "TECHNICAL" || user.accountType === "COMPANY" || user.accountType === "MACHINE_REP" || user.accountType === "SOFTWARE_REP") && (
          <Card className="bg-card border-border mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                <i className="fas fa-briefcase mr-2"></i>
                Informações Profissionais
              </CardTitle>
              {!isEditingTechnical && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingTechnical(true)}
                  data-testid="edit-technical-button"
                >
                  <i className="fas fa-edit mr-2"></i>
                  Editar
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditingTechnical ? (
                <div className="space-y-4">
                  {user.accountType === "TECHNICAL" && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">Cidade</Label>
                          <Input
                            id="city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Ex: São Paulo"
                            data-testid="input-edit-city"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">Estado</Label>
                          <Input
                            id="state"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            placeholder="Ex: SP"
                            data-testid="input-edit-state"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phoneNumber">Telefone</Label>
                          <Input
                            id="phoneNumber"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="(XX) XXXXX-XXXX"
                            data-testid="input-edit-phone"
                          />
                        </div>
                        <div>
                          <Label htmlFor="whatsappNumber">WhatsApp</Label>
                          <Input
                            id="whatsappNumber"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            placeholder="(XX) XXXXX-XXXX"
                            data-testid="input-edit-whatsapp"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cncMachine">Máquina CNC</Label>
                          <Input
                            id="cncMachine"
                            value={cncMachine}
                            onChange={(e) => setCncMachine(e.target.value)}
                            placeholder="Ex: Router CNC 3040"
                            data-testid="input-edit-cnc-machine"
                          />
                        </div>
                        <div>
                          <Label htmlFor="camSoftware">Software CAM</Label>
                          <Input
                            id="camSoftware"
                            value={camSoftware}
                            onChange={(e) => setCamSoftware(e.target.value)}
                            placeholder="Ex: Fusion 360"
                            data-testid="input-edit-cam-software"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="cncBrandId">Marca CNC (Opcional)</Label>
                        <Select value={cncBrandId || "none"} onValueChange={(value) => setCncBrandId(value === "none" ? "" : value)}>
                          <SelectTrigger data-testid="select-edit-cnc-brand">
                            <SelectValue placeholder="Selecione a marca CNC" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {cncBrands?.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="specialties">Especialidades (separadas por vírgula)</Label>
                        <Input
                          id="specialties"
                          value={specialties}
                          onChange={(e) => setSpecialties(e.target.value)}
                          placeholder="Ex: Móveis planejados, Esculturas, Corte 3D"
                          data-testid="input-edit-specialties"
                        />
                      </div>
                    </>
                  )}

                  {(user.accountType === "COMPANY" || user.accountType === "MACHINE_REP" || user.accountType === "SOFTWARE_REP") && (
                    <>
                      {(user.accountType === "MACHINE_REP" || user.accountType === "SOFTWARE_REP") && (
                        <div>
                          <Label htmlFor="representedBrand">
                            {user.accountType === "MACHINE_REP" ? "Marca de Máquina CNC que Representa" : "Software CAM que Representa"}
                          </Label>
                          <Select 
                            value={showBrandNotFoundAlert ? "not_listed" : (cncBrandId || "none")} 
                            onValueChange={(value) => {
                              if (value === "not_listed") {
                                setShowBrandNotFoundAlert(true);
                                setCncBrandId("");
                              } else if (value === "none") {
                                setShowBrandNotFoundAlert(false);
                                setCncBrandId("");
                              } else {
                                setShowBrandNotFoundAlert(false);
                                setCncBrandId(value);
                              }
                            }}
                          >
                            <SelectTrigger data-testid="select-edit-represented-brand">
                              <SelectValue placeholder="Selecione a marca/software" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Selecione uma opção</SelectItem>
                              {cncBrands?.map((brand) => (
                                <SelectItem key={brand.id} value={brand.id}>
                                  {brand.name}
                                </SelectItem>
                              ))}
                              <SelectItem value="not_listed" className="text-orange-500 font-semibold">
                                <i className="fas fa-exclamation-triangle mr-2"></i>
                                Minha marca não está na lista
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {showBrandNotFoundAlert && (
                            <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg" data-testid="brand-not-found-alert">
                              <div className="flex items-start space-x-3">
                                <i className="fas fa-info-circle text-orange-500 text-xl mt-1"></i>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-orange-500 mb-2">Marca não encontrada?</h4>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    Entre em contato com o administrador do site via WhatsApp para cadastrar sua marca/software.
                                  </p>
                                  <a
                                    href="https://wa.me/5511999999999?text=Olá!%20Sou%20representante%20e%20gostaria%20de%20cadastrar%20uma%20nova%20marca%20no%20MarceConnect."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                    data-testid="button-contact-admin-whatsapp"
                                  >
                                    <i className="fab fa-whatsapp mr-2 text-lg"></i>
                                    Contatar Administrador
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="companyName">Nome da Empresa</Label>
                          <Input
                            id="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Nome da sua empresa"
                            data-testid="input-edit-company-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="jobTitle">Cargo</Label>
                          <Input
                            id="jobTitle"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="Seu cargo"
                            data-testid="input-edit-job-title"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="companyWebsite">Website</Label>
                        <Input
                          id="companyWebsite"
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                          placeholder="https://seusite.com"
                          data-testid="input-edit-website"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phoneNumber">Telefone</Label>
                          <Input
                            id="phoneNumber"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="(XX) XXXXX-XXXX"
                            data-testid="input-edit-phone"
                          />
                        </div>
                        <div>
                          <Label htmlFor="whatsappNumber">WhatsApp</Label>
                          <Input
                            id="whatsappNumber"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            placeholder="(XX) XXXXX-XXXX"
                            data-testid="input-edit-whatsapp"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">Cidade</Label>
                          <Input
                            id="city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Ex: São Paulo"
                            data-testid="input-edit-city"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">Estado</Label>
                          <Input
                            id="state"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            placeholder="Ex: SP"
                            data-testid="input-edit-state"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex space-x-2 pt-4">
                    <Button
                      onClick={handleSaveTechnical}
                      disabled={updateTechnicalMutation.isPending}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      data-testid="save-technical-button"
                    >
                      {updateTechnicalMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check mr-2"></i>
                          Salvar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelTechnical}
                      disabled={updateTechnicalMutation.isPending}
                      data-testid="cancel-technical-button"
                    >
                      <i className="fas fa-times mr-2"></i>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.accountType === "TECHNICAL" && (
                    <>
                      {(city || state) && (
                        <p className="text-sm" data-testid="display-location">
                          <i className="fas fa-map-marker-alt mr-2 text-primary"></i>
                          <strong>Localização:</strong> {city}{city && state && ', '}{state || 'Não informado'}
                        </p>
                      )}
                      {phoneNumber && (
                        <p className="text-sm" data-testid="display-phone">
                          <i className="fas fa-phone mr-2 text-primary"></i>
                          <strong>Telefone:</strong> {phoneNumber}
                        </p>
                      )}
                      {whatsappNumber && (
                        <p className="text-sm" data-testid="display-whatsapp">
                          <i className="fab fa-whatsapp mr-2 text-primary"></i>
                          <strong>WhatsApp:</strong> {whatsappNumber}
                        </p>
                      )}
                      {cncMachine && (
                        <p className="text-sm" data-testid="display-cnc-machine">
                          <i className="fas fa-cogs mr-2 text-secondary"></i>
                          <strong>Máquina CNC:</strong> {cncMachine}
                        </p>
                      )}
                      {camSoftware && (
                        <p className="text-sm" data-testid="display-cam-software">
                          <i className="fas fa-laptop-code mr-2 text-secondary"></i>
                          <strong>Software CAM:</strong> {camSoftware}
                        </p>
                      )}
                      {user.specialties && user.specialties.length > 0 && (
                        <p className="text-sm" data-testid="display-specialties">
                          <i className="fas fa-star mr-2 text-yellow-500"></i>
                          <strong>Especialidades:</strong> {user.specialties.join(", ")}
                        </p>
                      )}
                      {user.cncBrandId && (
                        <p className="text-sm" data-testid="display-cnc-brand">
                          <i className="fas fa-industry mr-2 text-primary"></i>
                          <strong>Marca CNC:</strong> {cncBrands?.find(b => b.id === user.cncBrandId)?.name || 'Carregando...'}
                        </p>
                      )}
                      {!city && !state && !phoneNumber && !whatsappNumber && !cncMachine && !camSoftware && (!user.specialties || user.specialties.length === 0) && (
                        <p className="text-muted-foreground text-center py-4">
                          Nenhuma informação profissional adicionada ainda. Clique em "Editar" para adicionar suas informações.
                        </p>
                      )}
                    </>
                  )}

                  {(user.accountType === "COMPANY" || user.accountType === "MACHINE_REP" || user.accountType === "SOFTWARE_REP") && (
                    <>
                      {(user.accountType === "MACHINE_REP" || user.accountType === "SOFTWARE_REP") && user.cncBrandId && (
                        <p className="text-sm" data-testid="display-represented-brand">
                          <i className="fas fa-handshake mr-2 text-primary"></i>
                          <strong>{user.accountType === "MACHINE_REP" ? "Representa:" : "Representa Software:"}</strong> {cncBrands?.find(b => b.id === user.cncBrandId)?.name || 'Carregando...'}
                        </p>
                      )}
                      {companyName && (
                        <p className="text-sm" data-testid="display-company-name">
                          <i className="fas fa-building mr-2 text-blue-400"></i>
                          <strong>Empresa:</strong> {companyName}
                        </p>
                      )}
                      {jobTitle && (
                        <p className="text-sm" data-testid="display-job-title">
                          <i className="fas fa-id-badge mr-2 text-primary"></i>
                          <strong>Cargo:</strong> {jobTitle}
                        </p>
                      )}
                      {companyWebsite && (
                        <p className="text-sm" data-testid="display-website">
                          <i className="fas fa-globe mr-2 text-primary"></i>
                          <strong>Website:</strong> <a href={companyWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{companyWebsite}</a>
                        </p>
                      )}
                      {phoneNumber && (
                        <p className="text-sm" data-testid="display-phone">
                          <i className="fas fa-phone mr-2 text-primary"></i>
                          <strong>Telefone:</strong> {phoneNumber}
                        </p>
                      )}
                      {whatsappNumber && (
                        <p className="text-sm" data-testid="display-whatsapp">
                          <i className="fab fa-whatsapp mr-2 text-primary"></i>
                          <strong>WhatsApp:</strong> {whatsappNumber}
                        </p>
                      )}
                      {(city || state) && (
                        <p className="text-sm" data-testid="display-location">
                          <i className="fas fa-map-marker-alt mr-2 text-primary"></i>
                          <strong>Localização:</strong> {city}{city && state && ', '}{state}
                        </p>
                      )}
                      {!companyName && !jobTitle && !companyWebsite && !phoneNumber && !whatsappNumber && !city && !state && (
                        <p className="text-muted-foreground text-center py-4">
                          Nenhuma informação profissional adicionada ainda. Clique em "Editar" para adicionar suas informações.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects" data-testid="tab-projects">
              <i className="fas fa-folder mr-2"></i>
              Meus Projetos ({stats.projects})
            </TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">
              <i className="fas fa-clock mr-2"></i>
              Atividade Recente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            {userProjects && userProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {userProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <i className="fas fa-folder-open text-4xl text-muted-foreground mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">Nenhum projeto ainda</h3>
                  <p className="text-muted-foreground mb-6">
                    Comece compartilhando seu primeiro projeto com a comunidade!
                  </p>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => window.location.href = '/files'}
                    data-testid="upload-first-project"
                  >
                    Compartilhar Projeto
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userProjects && userProjects.length > 0 ? (
                    userProjects.slice(0, 5).map((project) => (
                      <div key={project.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted" data-testid={`activity-${project.id}`}>
                        <i className="fas fa-upload text-primary"></i>
                        <div className="flex-1">
                          <p className="font-medium">Projeto publicado: {project.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {project.createdAt ? new Date(project.createdAt).toLocaleDateString('pt-BR') : ''}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {project.downloadCount || 0} downloads
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <i className="fas fa-clock text-2xl mb-2"></i>
                      <p>Nenhuma atividade recente</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
