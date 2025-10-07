import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { User, CncBrand } from "@shared/schema";

export default function Technicians() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: technicians = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/technicians"],
  });

  const { data: cncBrands = [] } = useQuery<CncBrand[]>({
    queryKey: ["/api/cnc-brands"],
  });

  const filteredTechnicians = technicians.filter((tech) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${tech.firstName || ""} ${tech.lastName || ""}`.toLowerCase();
    const companyName = tech.companyName?.toLowerCase() || "";
    const machine = tech.cncMachine?.toLowerCase() || "";
    const software = tech.camSoftware?.toLowerCase() || "";
    const city = tech.city?.toLowerCase() || "";
    
    const matchesSearch = (
      fullName.includes(searchLower) ||
      companyName.includes(searchLower) ||
      machine.includes(searchLower) ||
      software.includes(searchLower) ||
      city.includes(searchLower)
    );
    
    const matchesState = !filterState || filterState === "all" || tech.state === filterState;
    const matchesBrand = !filterBrand || filterBrand === "all" || tech.cncBrandId === filterBrand || (filterBrand === "independent" && tech.isIndependent);
    
    return matchesSearch && matchesState && matchesBrand;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-user-gear text-primary text-2xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Técnicos CNC</h1>
              <p className="text-muted-foreground">
                Encontre profissionais especializados em marcenaria CNC
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <i className="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
              <Input
                type="text"
                placeholder="Buscar por nome, empresa, cidade, máquina ou software..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-technicians"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4"
              data-testid="button-toggle-filters"
            >
              <i className={`fas fa-${showFilters ? 'xmark' : 'sliders'} mr-2`}></i>
              {showFilters ? 'Fechar' : 'Filtros'}
            </Button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center">
                  <i className="fas fa-map-location-dot text-muted-foreground mr-2 text-sm"></i>
                  Filtrar por Estado
                </label>
                <Select value={filterState} onValueChange={setFilterState}>
                  <SelectTrigger data-testid="select-filter-state">
                    <SelectValue placeholder="Todos os estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
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
              
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center">
                  <i className="fas fa-microchip text-muted-foreground mr-2 text-sm"></i>
                  Filtrar por Marca CNC
                </label>
                <Select value={filterBrand} onValueChange={setFilterBrand}>
                  <SelectTrigger data-testid="select-filter-brand">
                    <SelectValue placeholder="Todas as marcas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as marcas</SelectItem>
                    <SelectItem value="independent">Independentes</SelectItem>
                    {cncBrands.filter(b => b.category === 'router').map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {((filterState && filterState !== "all") || (filterBrand && filterBrand !== "all")) && (
                <div className="md:col-span-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterState("all");
                      setFilterBrand("all");
                    }}
                    data-testid="button-clear-filters"
                  >
                    <i className="fas fa-rotate-left mr-2"></i>
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredTechnicians.length} técnico{filteredTechnicians.length !== 1 ? 's' : ''} encontrado{filteredTechnicians.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <i className="fas fa-circle-notch fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-muted-foreground">Carregando técnicos...</p>
          </div>
        )}

        {/* Technicians Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTechnicians.map((tech) => (
              <Card 
                key={tech.id} 
                className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer"
                data-testid={`card-technician-${tech.id}`}
              >
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={tech.profileImageUrl || undefined} />
                      <AvatarFallback className="text-lg">
                        {tech.firstName?.[0]?.toUpperCase() || tech.email?.[0]?.toUpperCase() || "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1">
                        {tech.firstName} {tech.lastName}
                      </CardTitle>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {tech.accountType === "TECHNICAL" && (
                          <Badge variant="secondary" className="text-xs">
                            <i className="fas fa-user-gear mr-1"></i>
                            Técnico
                          </Badge>
                        )}
                        {tech.accountType === "COMPANY" && (
                          <Badge variant="outline" className="text-xs">
                            <i className="fas fa-building-user mr-1"></i>
                            Empresa
                          </Badge>
                        )}
                        {tech.isVerified && (
                          <Badge className="text-xs bg-blue-500">
                            <i className="fas fa-check-circle mr-1"></i>
                            Verificado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Location */}
                  {(tech.city || tech.state) && (
                    <div className="flex items-center text-sm">
                      <i className="fas fa-location-dot w-5 text-muted-foreground"></i>
                      <span className="ml-2">
                        {tech.city && tech.state ? `${tech.city}, ${tech.state}` : tech.city || tech.state}
                      </span>
                    </div>
                  )}

                  {/* CNC Brand or Independent */}
                  {tech.accountType === "TECHNICAL" && (
                    <>
                      {tech.isIndependent ? (
                        <div className="flex items-center text-sm">
                          <i className="fas fa-user-astronaut w-5 text-muted-foreground"></i>
                          <span className="ml-2">Técnico Independente</span>
                        </div>
                      ) : tech.cncBrandId && (
                        <div className="flex items-center text-sm">
                          <i className="fas fa-microchip w-5 text-muted-foreground"></i>
                          <span className="ml-2">
                            {cncBrands.find(b => b.id === tech.cncBrandId)?.name || 'Marca CNC'}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Company Info */}
                  {tech.companyName && (
                    <div className="flex items-center text-sm">
                      <i className="fas fa-building-columns w-5 text-muted-foreground"></i>
                      <span className="ml-2">{tech.companyName}</span>
                    </div>
                  )}

                  {/* CNC Machine */}
                  {tech.cncMachine && (
                    <div className="flex items-start text-sm">
                      <i className="fas fa-gears w-5 text-muted-foreground mt-0.5"></i>
                      <div className="ml-2">
                        <p className="text-xs text-muted-foreground">Máquina CNC</p>
                        <p>{tech.cncMachine}</p>
                      </div>
                    </div>
                  )}

                  {/* CAM Software */}
                  {tech.camSoftware && (
                    <div className="flex items-start text-sm">
                      <i className="fas fa-display-code w-5 text-muted-foreground mt-0.5"></i>
                      <div className="ml-2">
                        <p className="text-xs text-muted-foreground">Software CAM</p>
                        <p>{tech.camSoftware}</p>
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {tech.yearsExperience && (
                    <div className="flex items-center text-sm">
                      <i className="fas fa-calendar-days w-5 text-muted-foreground"></i>
                      <span className="ml-2">{tech.yearsExperience} anos de experiência</span>
                    </div>
                  )}

                  {/* Specialties */}
                  {tech.specialties && tech.specialties.length > 0 && (
                    <div className="flex items-start text-sm">
                      <i className="fas fa-sparkles w-5 text-muted-foreground mt-0.5"></i>
                      <div className="ml-2">
                        <p className="text-xs text-muted-foreground mb-1">Especialidades</p>
                        <div className="flex flex-wrap gap-1">
                          {tech.specialties.slice(0, 3).map((specialty, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {tech.specialties.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{tech.specialties.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  {tech.bio && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tech.bio}
                      </p>
                    </div>
                  )}

                  {/* Service Area */}
                  {tech.serviceArea && (
                    <div className="flex items-start text-sm">
                      <i className="fas fa-map-pin w-5 text-muted-foreground mt-0.5"></i>
                      <div className="ml-2">
                        <p className="text-xs text-muted-foreground">Área de Atendimento</p>
                        <p className="line-clamp-2">{tech.serviceArea}</p>
                      </div>
                    </div>
                  )}

                  {/* Machines Maintenance */}
                  {tech.machinesMaintenance && tech.machinesMaintenance.length > 0 && (
                    <div className="flex items-start text-sm">
                      <i className="fas fa-screwdriver-wrench w-5 text-muted-foreground mt-0.5"></i>
                      <div className="ml-2">
                        <p className="text-xs text-muted-foreground mb-1">Manutenção</p>
                        <div className="flex flex-wrap gap-1">
                          {tech.machinesMaintenance.slice(0, 2).map((machine, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {machine}
                            </Badge>
                          ))}
                          {tech.machinesMaintenance.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{tech.machinesMaintenance.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  {(tech.phoneNumber || tech.whatsappNumber) && (
                    <div className="pt-2 border-t border-border space-y-2">
                      {tech.phoneNumber && (
                        <div className="flex items-center text-sm">
                          <i className="fas fa-phone-volume w-5 text-primary"></i>
                          <a href={`tel:${tech.phoneNumber}`} className="ml-2 hover:underline">
                            {tech.phoneNumber}
                          </a>
                        </div>
                      )}
                      {tech.whatsappNumber && (
                        <div className="flex items-center text-sm">
                          <i className="fab fa-whatsapp w-5 text-green-500"></i>
                          <a 
                            href={`https://wa.me/${tech.whatsappNumber.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {tech.whatsappNumber}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Website */}
                  {tech.companyWebsite && (
                    <div className="pt-2">
                      <a
                        href={tech.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="fas fa-globe mr-2"></i>
                        Visitar website
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTechnicians.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-user-group text-6xl text-muted-foreground mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">Nenhum técnico encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Tente ajustar sua busca"
                : "Ainda não há técnicos cadastrados"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
