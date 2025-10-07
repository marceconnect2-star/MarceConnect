import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { CncBrand } from "@shared/schema";

export default function CompleteProfile() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [accountType, setAccountType] = useState<"USER" | "TECHNICAL" | "COMPANY" | "MACHINE_REP" | "SOFTWARE_REP">("USER");
  const [bio, setBio] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [cncMachine, setCncMachine] = useState("");
  const [camSoftware, setCamSoftware] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [cncBrandId, setCncBrandId] = useState("");
  const [isIndependent, setIsIndependent] = useState(false);
  const [machinesMaintenance, setMachinesMaintenance] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  
  const { data: cncBrands } = useQuery<CncBrand[]>({
    queryKey: ["/api/cnc-brands"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiRequest("PUT", "/api/profile", profileData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil configurado!",
        description: "Bem-vindo à MarceConnect",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Erro ao configurar perfil",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/api/login";
    }
  }, [user, authLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const profileData: any = {
      accountType,
      bio: bio.trim(),
    };

    if (accountType === "COMPANY" || accountType === "MACHINE_REP" || accountType === "SOFTWARE_REP") {
      profileData.companyName = companyName.trim();
      profileData.jobTitle = jobTitle.trim();
      profileData.companyWebsite = companyWebsite.trim();
    }

    if (accountType === "TECHNICAL" || accountType === "COMPANY" || accountType === "MACHINE_REP" || accountType === "SOFTWARE_REP") {
      profileData.cncMachine = cncMachine.trim();
      profileData.camSoftware = camSoftware.trim();
      if (yearsExperience) {
        profileData.yearsExperience = parseInt(yearsExperience);
      }
    }
    
    if (accountType === "TECHNICAL") {
      profileData.city = city.trim();
      profileData.state = state.trim();
      profileData.serviceArea = serviceArea.trim();
      profileData.cncBrandId = (cncBrandId && cncBrandId !== "none") ? cncBrandId : null;
      profileData.isIndependent = isIndependent;
      profileData.machinesMaintenance = machinesMaintenance.trim() 
        ? machinesMaintenance.split(',').map(m => m.trim()).filter(Boolean)
        : [];
      profileData.phoneNumber = phoneNumber.trim();
      profileData.whatsappNumber = whatsappNumber.trim();
    }

    updateProfileMutation.mutate(profileData);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <i className="fas fa-user-cog text-primary mr-3"></i>
              Complete seu Perfil
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Escolha o tipo de conta e preencha suas informações para aproveitar ao máximo a plataforma
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Type Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Tipo de Conta *</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  ⚠️ Escolha com atenção! Propaganda não é permitida no site. Somente admin pode criar contas de administrador.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType("USER")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      accountType === "USER"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid="account-type-user"
                  >
                    <i className="fas fa-user text-2xl mb-2 text-primary"></i>
                    <h3 className="font-semibold text-sm">Marceneiro</h3>
                    <p className="text-xs text-muted-foreground">Hobbysta ou profissional</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setAccountType("TECHNICAL")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      accountType === "TECHNICAL"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid="account-type-technical"
                  >
                    <i className="fas fa-tools text-2xl mb-2 text-secondary"></i>
                    <h3 className="font-semibold text-sm">Técnico CNC</h3>
                    <p className="text-xs text-muted-foreground">Profissional técnico</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setAccountType("COMPANY")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      accountType === "COMPANY"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid="account-type-company"
                  >
                    <i className="fas fa-building text-2xl mb-2 text-blue-500"></i>
                    <h3 className="font-semibold text-sm">Empresa</h3>
                    <p className="text-xs text-muted-foreground">Marca ou fabricante</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setAccountType("MACHINE_REP")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      accountType === "MACHINE_REP"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid="account-type-machine-rep"
                  >
                    <i className="fas fa-cog text-2xl mb-2 text-orange-500"></i>
                    <h3 className="font-semibold text-sm">Rep. Máquinas</h3>
                    <p className="text-xs text-muted-foreground">Representante de routers</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setAccountType("SOFTWARE_REP")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      accountType === "SOFTWARE_REP"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid="account-type-software-rep"
                  >
                    <i className="fas fa-code text-2xl mb-2 text-purple-500"></i>
                    <h3 className="font-semibold text-sm">Rep. Software</h3>
                    <p className="text-xs text-muted-foreground">Representante de CAM</p>
                  </button>
                </div>
              </div>

              {/* Company/Representative Fields */}
              {(accountType === "COMPANY" || accountType === "MACHINE_REP" || accountType === "SOFTWARE_REP") && (
                <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold text-primary flex items-center">
                    <i className="fas fa-building mr-2"></i>
                    Informações da Empresa
                  </h3>
                  
                  <div>
                    <Label htmlFor="company-name">Nome da Empresa *</Label>
                    <Input
                      id="company-name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Máquinas CNC Brasil"
                      required
                      data-testid="input-company-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="job-title">Seu Cargo</Label>
                    <Input
                      id="job-title"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Ex: Diretor Técnico"
                      data-testid="input-job-title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company-website">Website da Empresa</Label>
                    <Input
                      id="company-website"
                      type="url"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="https://..."
                      data-testid="input-company-website"
                    />
                  </div>
                </div>
              )}

              {/* Technical Fields */}
              {accountType === "TECHNICAL" && (
                <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold text-secondary flex items-center">
                    <i className="fas fa-map-marker-alt mr-2"></i>
                    Localização e Atendimento
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city" className="flex items-center">
                        <i className="fas fa-city text-muted-foreground mr-2 text-sm"></i>
                        Cidade *
                      </Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ex: São Paulo"
                        required
                        data-testid="input-city"
                      />
                    </div>

                    <div>
                      <Label htmlFor="state" className="flex items-center">
                        <i className="fas fa-map text-muted-foreground mr-2 text-sm"></i>
                        Estado *
                      </Label>
                      <Select value={state} onValueChange={setState}>
                        <SelectTrigger data-testid="select-state">
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AC">Acre</SelectItem>
                          <SelectItem value="AL">Alagoas</SelectItem>
                          <SelectItem value="AP">Amapá</SelectItem>
                          <SelectItem value="AM">Amazonas</SelectItem>
                          <SelectItem value="BA">Bahia</SelectItem>
                          <SelectItem value="CE">Ceará</SelectItem>
                          <SelectItem value="DF">Distrito Federal</SelectItem>
                          <SelectItem value="ES">Espírito Santo</SelectItem>
                          <SelectItem value="GO">Goiás</SelectItem>
                          <SelectItem value="MA">Maranhão</SelectItem>
                          <SelectItem value="MT">Mato Grosso</SelectItem>
                          <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                          <SelectItem value="MG">Minas Gerais</SelectItem>
                          <SelectItem value="PA">Pará</SelectItem>
                          <SelectItem value="PB">Paraíba</SelectItem>
                          <SelectItem value="PR">Paraná</SelectItem>
                          <SelectItem value="PE">Pernambuco</SelectItem>
                          <SelectItem value="PI">Piauí</SelectItem>
                          <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                          <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                          <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                          <SelectItem value="RO">Rondônia</SelectItem>
                          <SelectItem value="RR">Roraima</SelectItem>
                          <SelectItem value="SC">Santa Catarina</SelectItem>
                          <SelectItem value="SP">São Paulo</SelectItem>
                          <SelectItem value="SE">Sergipe</SelectItem>
                          <SelectItem value="TO">Tocantins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="service-area" className="flex items-center">
                      <i className="fas fa-route text-muted-foreground mr-2 text-sm"></i>
                      Área de Atendimento
                    </Label>
                    <Textarea
                      id="service-area"
                      value={serviceArea}
                      onChange={(e) => setServiceArea(e.target.value)}
                      placeholder="Ex: Atendo toda a região metropolitana de São Paulo, incluindo ABC e Campinas"
                      rows={2}
                      data-testid="textarea-service-area"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="flex items-center">
                        <i className="fas fa-phone text-muted-foreground mr-2 text-sm"></i>
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="(11) 98765-4321"
                        data-testid="input-phone"
                      />
                    </div>

                    <div>
                      <Label htmlFor="whatsapp" className="flex items-center">
                        <i className="fab fa-whatsapp text-muted-foreground mr-2 text-sm"></i>
                        WhatsApp
                      </Label>
                      <Input
                        id="whatsapp"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="(11) 98765-4321"
                        data-testid="input-whatsapp"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Technical/Company Fields */}
              {(accountType === "TECHNICAL" || accountType === "COMPANY") && (
                <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold text-secondary flex items-center">
                    <i className="fas fa-cogs mr-2"></i>
                    Informações Técnicas
                  </h3>

                  {accountType === "TECHNICAL" && (
                    <>
                      <div>
                        <Label htmlFor="cnc-brand" className="flex items-center">
                          <i className="fas fa-industry text-muted-foreground mr-2 text-sm"></i>
                          Marca CNC Associada
                        </Label>
                        <Select value={cncBrandId} onValueChange={setCncBrandId}>
                          <SelectTrigger data-testid="select-cnc-brand">
                            <SelectValue placeholder="Selecione a marca ou deixe vazio se independente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma (Independente)</SelectItem>
                            {cncBrands && cncBrands.filter(b => b.category === 'router').map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="independent" 
                          checked={isIndependent}
                          onCheckedChange={(checked) => setIsIndependent(checked as boolean)}
                          data-testid="checkbox-independent"
                        />
                        <Label 
                          htmlFor="independent" 
                          className="text-sm cursor-pointer"
                        >
                          Sou técnico independente (não vinculado a marca específica)
                        </Label>
                      </div>

                      <div>
                        <Label htmlFor="machines-maintenance" className="flex items-center">
                          <i className="fas fa-wrench text-muted-foreground mr-2 text-sm"></i>
                          Máquinas que Faz Manutenção
                        </Label>
                        <Textarea
                          id="machines-maintenance"
                          value={machinesMaintenance}
                          onChange={(e) => setMachinesMaintenance(e.target.value)}
                          placeholder="Ex: Router CNC 1325, Router CNC 1530, Laser CO2 (separe por vírgula)"
                          rows={2}
                          data-testid="textarea-machines"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Separe as máquinas por vírgula
                        </p>
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="cnc-machine">Máquina CNC que Possui</Label>
                    <Input
                      id="cnc-machine"
                      value={cncMachine}
                      onChange={(e) => setCncMachine(e.target.value)}
                      placeholder="Ex: Router CNC 1325, Laser CO2"
                      data-testid="input-cnc-machine"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cam-software">Software CAM</Label>
                    <Input
                      id="cam-software"
                      value={camSoftware}
                      onChange={(e) => setCamSoftware(e.target.value)}
                      placeholder="Ex: Fusion 360, VCarve, Aspire"
                      data-testid="input-cam-software"
                    />
                  </div>

                  <div>
                    <Label htmlFor="years-experience">Anos de Experiência</Label>
                    <Input
                      id="years-experience"
                      type="number"
                      min="0"
                      max="50"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      placeholder="Ex: 5"
                      data-testid="input-years-experience"
                    />
                  </div>
                </div>
              )}

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Sobre Você</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre sua experiência com marcenaria CNC, projetos favoritos, especialidades..."
                  rows={4}
                  data-testid="textarea-bio"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={updateProfileMutation.isPending || 
                    (accountType === "COMPANY" && !companyName.trim()) ||
                    (accountType === "TECHNICAL" && (!city.trim() || !state.trim()))}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check mr-2"></i>
                      Salvar e Continuar
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-skip"
                >
                  Pular por enquanto
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
